import { describe, expect, it } from 'vitest'

import type { LogEntry } from '../../domain/logs'
import { CUMULOG_LOG_COLLECTION, type CumulogLogRecord } from '../../domain/types'
import { initialLogsState, logsReducer, type LogsState } from '../logs-state'

const earlier: CumulogLogRecord = {
  $type: CUMULOG_LOG_COLLECTION,
  title: 'Earlier',
  activityDate: '2026-01-01',
  spoiler: 'none',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const later: CumulogLogRecord = {
  ...earlier,
  title: 'Later',
  activityDate: '2026-02-01',
  createdAt: '2026-02-01T00:00:00.000Z',
}

const entry = (uri: string, cid: string, record: CumulogLogRecord): LogEntry => ({
  kind: 'readable',
  uri,
  cid,
  record,
})

describe('logsReducer', () => {
  it('distinguishes a successfully loaded empty list from an error', () => {
    const loaded = logsReducer(initialLogsState, { type: 'loaded', entries: [] })
    expect(loaded).toEqual({ status: 'loaded', entries: [], error: null })

    const error = new Error('network')
    const failed = logsReducer(initialLogsState, { type: 'failed', error })
    expect(failed.status).toBe('error')
    expect(failed.entries).toEqual([])
    expect(failed.error).toBe(error)
  })

  it('keeps current entries visible while loading and after a reload error', () => {
    const current: LogsState = {
      status: 'loaded',
      entries: [entry('at://did/log/one', 'cid-1', earlier)],
      error: null,
    }
    const loading = logsReducer(current, { type: 'loading' })
    expect(loading.entries).toEqual(current.entries)

    const failed = logsReducer(loading, { type: 'failed', error: 'failed' })
    expect(failed.entries).toEqual(current.entries)
    expect(failed.status).toBe('error')
  })

  it('applies a confirmed creation and sorts the result', () => {
    const state: LogsState = {
      status: 'loaded',
      entries: [entry('at://did/log/one', 'cid-1', earlier)],
      error: null,
    }
    const result = logsReducer(state, {
      type: 'created', uri: 'at://did/log/two', cid: 'cid-2', record: later,
    })
    expect(result.entries.map(({ uri }) => uri)).toEqual([
      'at://did/log/two',
      'at://did/log/one',
    ])
  })

  it('applies a confirmed update with the new CID and position', () => {
    const state: LogsState = {
      status: 'loaded',
      entries: [
        entry('at://did/log/one', 'cid-1', earlier),
        entry('at://did/log/two', 'cid-2', later),
      ],
      error: null,
    }
    const newest = { ...later, title: 'Updated', activityDate: '2026-03-01' }
    const result = logsReducer(state, {
      type: 'updated', uri: 'at://did/log/one', cid: 'cid-new', record: newest,
    })
    expect(result.entries[0]).toMatchObject({
      uri: 'at://did/log/one', cid: 'cid-new', record: { title: 'Updated' },
    })
    expect(result.entries).toHaveLength(2)
  })

  it('applies a confirmed deletion by URI', () => {
    const state: LogsState = {
      status: 'loaded',
      entries: [entry('at://did/log/one', 'cid-1', earlier)],
      error: null,
    }
    const result = logsReducer(state, { type: 'deleted', uri: 'at://did/log/one' })
    expect(result).toEqual({ status: 'loaded', entries: [], error: null })
  })

  it('clears in-memory data when the session is reset', () => {
    const state: LogsState = {
      status: 'error',
      entries: [entry('at://did/log/one', 'cid-1', earlier)],
      error: new Error('failed'),
    }
    expect(logsReducer(state, { type: 'reset' })).toEqual(initialLogsState)
  })
})

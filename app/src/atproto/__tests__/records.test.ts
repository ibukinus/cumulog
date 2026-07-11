import { type Agent, XRPCError } from '@atproto/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CUMULOG_LOG_COLLECTION, type CumulogLogRecord } from '../../domain/types'
import {
  createLog,
  deleteLog,
  getLog,
  listAllLogs,
  RecordClientError,
  updateLog,
} from '../records'

const did = 'did:plc:alice'
const headers = {}

function agentWith(repo: Record<string, unknown>): Agent {
  return { com: { atproto: { repo } } } as unknown as Agent
}

function readableValue(createdAt = '2026-07-11T00:00:00.000Z'): CumulogLogRecord {
  return {
    $type: CUMULOG_LOG_COLLECTION,
    title: '散歩',
    activityDate: '2026-07-11',
    spoiler: 'none',
    createdAt,
  }
}

function expectKind(kind: RecordClientError['kind']) {
  return expect.objectContaining({ kind })
}

describe('PDS record client', () => {
  beforeEach(() => vi.useRealTimers())

  it('follows cursors, combines every page, and parses unreadable records', async () => {
    const listRecords = vi.fn()
      .mockResolvedValueOnce({
        success: true,
        headers,
        data: {
          cursor: 'next',
          records: [{ uri: 'at://one', cid: 'cid-one', value: readableValue() }],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        headers,
        data: {
          records: [{ uri: 'at://two', cid: 'cid-two', value: { title: 123 } }],
        },
      })

    await expect(listAllLogs(agentWith({ listRecords }), did)).resolves.toEqual([
      { kind: 'readable', uri: 'at://one', cid: 'cid-one', record: readableValue() },
      { kind: 'unreadable', uri: 'at://two', cid: 'cid-two' },
    ])
    expect(listRecords).toHaveBeenNthCalledWith(1, {
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      limit: 100,
    }, { signal: expect.any(AbortSignal) })
    expect(listRecords).toHaveBeenNthCalledWith(2, {
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      limit: 100,
      cursor: 'next',
    }, { signal: expect.any(AbortSignal) })
  })

  it('creates a record in the authenticated repository with a client timestamp', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-11T12:34:56.789Z'))
    const createRecord = vi.fn().mockResolvedValue({
      success: true,
      headers,
      data: { uri: 'at://created', cid: 'new-cid' },
    })

    await expect(createLog(agentWith({ createRecord }), did, {
      title: '読書',
      activityDate: '2026-07-10',
      spoiler: 'minor',
    })).resolves.toEqual({ uri: 'at://created', cid: 'new-cid' })
    expect(createRecord).toHaveBeenCalledWith({
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      record: {
        $type: CUMULOG_LOG_COLLECTION,
        title: '読書',
        activityDate: '2026-07-10',
        spoiler: 'minor',
        createdAt: '2026-07-11T12:34:56.789Z',
      },
    }, { signal: expect.any(AbortSignal) })
  })

  it('uses record CID CAS for updates and preserves createdAt', async () => {
    const putRecord = vi.fn().mockResolvedValue({
      success: true,
      headers,
      data: { uri: 'at://updated', cid: 'updated-cid' },
    })
    const value = readableValue('2020-01-02T03:04:05.000Z')

    await updateLog(agentWith({ putRecord }), did, 'key', value, 'old-cid')
    expect(putRecord).toHaveBeenCalledWith({
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      rkey: 'key',
      record: value,
      swapRecord: 'old-cid',
    }, { signal: expect.any(AbortSignal) })
  })

  it('uses record CID CAS for deletes', async () => {
    const deleteRecord = vi.fn().mockResolvedValue({ success: true, headers, data: {} })
    await deleteLog(agentWith({ deleteRecord }), did, 'key', 'old-cid')
    expect(deleteRecord).toHaveBeenCalledWith({
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      rkey: 'key',
      swapRecord: 'old-cid',
    }, { signal: expect.any(AbortSignal) })
  })

  it('classifies timed-out writes as maybe-saved and timed-out reads as failed', async () => {
    const timeout = new DOMException('The operation timed out', 'TimeoutError')
    const createRecord = vi.fn().mockRejectedValue(timeout)
    await expect(createLog(agentWith({ createRecord }), did, {
      title: '読書',
      activityDate: '2026-07-10',
      spoiler: 'none',
    })).rejects.toEqual(expectKind('maybe-saved'))

    const listRecords = vi.fn().mockRejectedValue(timeout)
    await expect(listAllLogs(agentWith({ listRecords }), did)).rejects.toEqual(expectKind('failed'))
  })

  it.each(['putRecord', 'deleteRecord'])('classifies %s InvalidSwap as conflict', async (method) => {
    const repo = { [method]: vi.fn().mockRejectedValue(new XRPCError(400, 'InvalidSwap')) }
    const operation = method === 'putRecord'
      ? updateLog(agentWith(repo), did, 'key', readableValue(), 'stale-cid')
      : deleteLog(agentWith(repo), did, 'key', 'stale-cid')
    await expect(operation).rejects.toEqual(expectKind('conflict'))
  })

  it.each([[401, 'auth-expired'], [403, 'permission']] as const)(
    'classifies HTTP %i as %s',
    async (status, kind) => {
      const getRecord = vi.fn().mockRejectedValue(new XRPCError(status))
      await expect(getLog(agentWith({ getRecord }), did, 'key')).rejects.toEqual(expectKind(kind))
    },
  )

  it('classifies a missing getRecord target as not-found', async () => {
    const getRecord = vi.fn().mockRejectedValue(new XRPCError(400, 'RecordNotFound'))
    await expect(getLog(agentWith({ getRecord }), did, 'key')).rejects.toEqual(expectKind('not-found'))
  })

  it('classifies a network failure during a write as maybe-saved and keeps its cause', async () => {
    const networkError = new TypeError('fetch failed')
    const createRecord = vi.fn().mockRejectedValue(networkError)
    const error = await createLog(agentWith({ createRecord }), did, {
      title: '映画',
      activityDate: '2026-07-11',
      spoiler: 'major',
    }).catch((cause: unknown) => cause)

    expect(error).toEqual(expectKind('maybe-saved'))
    expect(error).toBeInstanceOf(RecordClientError)
    expect((error as RecordClientError).cause).toBe(networkError)
  })

  it('treats a missing CID as a failed response', async () => {
    const getRecord = vi.fn().mockResolvedValue({
      success: true,
      headers,
      data: { uri: 'at://missing-cid', value: readableValue() },
    })
    await expect(getLog(agentWith({ getRecord }), did, 'key')).rejects.toEqual(expectKind('failed'))
  })
})

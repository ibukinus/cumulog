import { parseLogRecord, sortLogEntries, type LogEntry } from '../domain/logs'
import type { CumulogLogRecord } from '../domain/types'

export type LogsState = {
  status: 'idle' | 'loading' | 'loaded' | 'error'
  entries: LogEntry[]
  error: unknown
}

export type LogsAction =
  | { type: 'reset' }
  | { type: 'loading' }
  | { type: 'loaded'; entries: LogEntry[] }
  | { type: 'failed'; error: unknown }
  | { type: 'created'; uri: string; cid: string; record: CumulogLogRecord }
  | { type: 'updated'; uri: string; cid: string; record: CumulogLogRecord }
  | { type: 'deleted'; uri: string }

export const initialLogsState: LogsState = {
  status: 'idle',
  entries: [],
  error: null,
}

export function logsReducer(state: LogsState, action: LogsAction): LogsState {
  switch (action.type) {
    case 'reset':
      return initialLogsState
    case 'loading':
      return { ...state, status: 'loading', error: null }
    case 'loaded':
      return { status: 'loaded', entries: sortLogEntries(action.entries), error: null }
    case 'failed':
      return { ...state, status: 'error', error: action.error }
    case 'created': {
      const entry = parseLogRecord(action.uri, action.cid, action.record)
      return {
        status: 'loaded',
        entries: sortLogEntries([...state.entries.filter(({ uri }) => uri !== action.uri), entry]),
        error: null,
      }
    }
    case 'updated': {
      const entry = parseLogRecord(action.uri, action.cid, action.record)
      const exists = state.entries.some(({ uri }) => uri === action.uri)
      const entries = state.entries.map((current) => current.uri === action.uri ? entry : current)
      return {
        status: 'loaded',
        entries: sortLogEntries(exists ? entries : [...entries, entry]),
        error: null,
      }
    }
    case 'deleted':
      return {
        status: 'loaded',
        entries: state.entries.filter(({ uri }) => uri !== action.uri),
        error: null,
      }
  }
}

// design-previewモードで atproto/records を差し替えるモック（vite.config.tsのalias参照）。
// fixtureを初期値とするメモリ上のストアに対してCRUDする。
import type { LogEntry } from '../domain/logs'
import { CUMULOG_LOG_COLLECTION, type CumulogLogRecord } from '../domain/types'
import type { ActivityLogRecordInput } from '../domain/validation'
import { PREVIEW_ENTRIES } from './fixtures'

export const timeoutSignal = () => AbortSignal.timeout(30_000)

export type RecordErrorKind =
  | 'auth-expired'
  | 'permission'
  | 'conflict'
  | 'not-found'
  | 'maybe-saved'
  | 'failed'

export class RecordClientError extends Error {
  readonly kind: RecordErrorKind

  constructor(kind: RecordErrorKind, cause?: unknown) {
    super(`PDS record operation failed: ${kind}`, { cause })
    this.name = 'RecordClientError'
    this.kind = kind
  }
}

export function classifyError(cause: unknown, _operation: 'read' | 'write'): RecordClientError {
  if (cause instanceof RecordClientError) return cause
  return new RecordClientError('failed', cause)
}

const rkeyOf = (uri: string): string => uri.slice(uri.lastIndexOf('/') + 1)

const store = new Map<string, LogEntry>(
  PREVIEW_ENTRIES.map((preview) => [rkeyOf(preview.uri), preview]),
)
let sequence = 0

export async function listAllLogs(_agent: unknown, _did: string): Promise<LogEntry[]> {
  return [...store.values()]
}

export async function getLog(_agent: unknown, _did: string, rkey: string): Promise<LogEntry> {
  const entry = store.get(rkey)
  if (entry === undefined) throw new RecordClientError('not-found')
  return entry
}

export async function createLog(
  _agent: unknown,
  did: string,
  input: ActivityLogRecordInput,
): Promise<{ uri: string; cid: string }> {
  const rkey = `preview-new-${++sequence}`
  const uri = `at://${did}/${CUMULOG_LOG_COLLECTION}/${rkey}`
  const cid = `preview-cid-${rkey}`
  const record: CumulogLogRecord = {
    $type: CUMULOG_LOG_COLLECTION,
    ...input,
    createdAt: new Date().toISOString(),
  }
  store.set(rkey, { kind: 'readable', uri, cid, record })
  return { uri, cid }
}

export async function updateLog(
  _agent: unknown,
  _did: string,
  rkey: string,
  value: CumulogLogRecord,
  _swapCid: string,
): Promise<{ uri: string; cid: string }> {
  const current = store.get(rkey)
  if (current === undefined) throw new RecordClientError('not-found')
  const cid = `preview-cid-${rkey}-rev${++sequence}`
  store.set(rkey, { kind: 'readable', uri: current.uri, cid, record: value })
  return { uri: current.uri, cid }
}

export async function deleteLog(
  _agent: unknown,
  _did: string,
  rkey: string,
  _swapCid: string,
): Promise<void> {
  if (!store.has(rkey)) throw new RecordClientError('not-found')
  store.delete(rkey)
}

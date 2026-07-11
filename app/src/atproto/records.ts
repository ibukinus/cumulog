import { type Agent, XRPCError } from '@atproto/api'

import { parseLogRecord, type LogEntry } from '../domain/logs'
import {
  CUMULOG_LOG_COLLECTION,
  type CumulogLogRecord,
} from '../domain/types'
import type { ActivityLogRecordInput } from '../domain/validation'

const LIST_RECORDS_LIMIT = 100

// XRPC呼び出しの上限時間。オフライン等でfetchが完了しない場合に
// 「保存中」のまま固まるのを防ぐ（超過時は書き込み=maybe-saved / 読み取り=failed）
const XRPC_TIMEOUT_MS = 30_000

const timeoutSignal = () => AbortSignal.timeout(XRPC_TIMEOUT_MS)

const isAbortLike = (cause: unknown): boolean =>
  cause instanceof DOMException && (cause.name === 'TimeoutError' || cause.name === 'AbortError')

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

type Operation = 'read' | 'write'

function classifyError(cause: unknown, operation: Operation): RecordClientError {
  if (cause instanceof RecordClientError) return cause

  if (cause instanceof XRPCError) {
    if (cause.status === 401) return new RecordClientError('auth-expired', cause)
    if (cause.status === 403) return new RecordClientError('permission', cause)
    if (cause.error === 'InvalidSwap') return new RecordClientError('conflict', cause)
    if (cause.error === 'RecordNotFound') return new RecordClientError('not-found', cause)
    if (operation === 'write' && cause.status === 1) {
      return new RecordClientError('maybe-saved', cause)
    }
  }

  // fetch rejects with TypeError. Mocks and alternative Agent transports may expose
  // that original error instead of wrapping it in an XRPCError with status 1.
  if (operation === 'write' && cause instanceof TypeError) {
    return new RecordClientError('maybe-saved', cause)
  }
  // タイムアウト・中断は、書き込みではリクエスト到達後の失敗と区別できない
  if (isAbortLike(cause)) {
    return new RecordClientError(operation === 'write' ? 'maybe-saved' : 'failed', cause)
  }
  return new RecordClientError('failed', cause)
}

function requireCid(cid: string | undefined): string {
  if (cid === undefined || cid === '') {
    throw new RecordClientError('failed', new Error('PDS response did not include a CID'))
  }
  return cid
}

export async function listAllLogs(agent: Agent, did: string): Promise<LogEntry[]> {
  const entries: LogEntry[] = []
  let cursor: string | undefined

  try {
    do {
      const response = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: CUMULOG_LOG_COLLECTION,
        limit: LIST_RECORDS_LIMIT,
        ...(cursor === undefined ? {} : { cursor }),
      }, { signal: timeoutSignal() })
      for (const item of response.data.records) {
        entries.push(parseLogRecord(item.uri, requireCid(item.cid), item.value))
      }
      cursor = response.data.cursor
    } while (cursor !== undefined)
    return entries
  } catch (cause) {
    throw classifyError(cause, 'read')
  }
}

export async function getLog(agent: Agent, did: string, rkey: string): Promise<LogEntry> {
  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      rkey,
    }, { signal: timeoutSignal() })
    return parseLogRecord(response.data.uri, requireCid(response.data.cid), response.data.value)
  } catch (cause) {
    throw classifyError(cause, 'read')
  }
}

export async function createLog(
  agent: Agent,
  did: string,
  input: ActivityLogRecordInput,
): Promise<{ uri: string; cid: string }> {
  try {
    const response = await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      record: {
        $type: CUMULOG_LOG_COLLECTION,
        ...input,
        createdAt: new Date().toISOString(),
      },
    }, { signal: timeoutSignal() })
    return { uri: response.data.uri, cid: requireCid(response.data.cid) }
  } catch (cause) {
    throw classifyError(cause, 'write')
  }
}

export async function updateLog(
  agent: Agent,
  did: string,
  rkey: string,
  value: CumulogLogRecord,
  swapCid: string,
): Promise<{ uri: string; cid: string }> {
  try {
    const response = await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      rkey,
      record: { ...value },
      swapRecord: swapCid,
    }, { signal: timeoutSignal() })
    return { uri: response.data.uri, cid: requireCid(response.data.cid) }
  } catch (cause) {
    throw classifyError(cause, 'write')
  }
}

export async function deleteLog(
  agent: Agent,
  did: string,
  rkey: string,
  swapCid: string,
): Promise<void> {
  try {
    await agent.com.atproto.repo.deleteRecord({
      repo: did,
      collection: CUMULOG_LOG_COLLECTION,
      rkey,
      swapRecord: swapCid,
    }, { signal: timeoutSignal() })
  } catch (cause) {
    throw classifyError(cause, 'write')
  }
}

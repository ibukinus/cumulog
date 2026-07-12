import {
  extractHandle,
  extractPdsServiceEndpoint,
  IdentityResolutionError,
  resolveDidDocument,
} from './identity'
import { parseLogRecord, type LogEntry } from '../domain/logs'
import { CUMULOG_LOG_COLLECTION } from '../domain/types'
import {
  classifyError,
  RecordClientError,
  timeoutSignal,
} from './records'

// 未認証での公開レコード取得（design/05-data-flow.md「公開共有ページの取得」）。
// 失敗時は records.ts の RecordClientError（'not-found' | 'failed'）を throw する

// DID解決の内部fetchにもタイムアウトを効かせ、応答がない場合に読み込み中のまま固まらないようにする
const withTimeout = (fetcher: typeof fetch): typeof fetch =>
  (input, init) => fetcher(input, { ...init, signal: timeoutSignal() })

export async function fetchPublicLog(
  did: string,
  rkey: string,
  fetcher: typeof fetch = fetch,
): Promise<LogEntry> {
  try {
    let document
    try {
      document = await resolveDidDocument(did, withTimeout(fetcher))
    } catch (cause) {
      if (cause instanceof IdentityResolutionError && cause.status === 404) {
        throw new RecordClientError('not-found', cause)
      }
      throw cause
    }

    const endpoint = extractPdsServiceEndpoint(document).replace(/\/+$/, '')
    const url = new URL(`${endpoint}/xrpc/com.atproto.repo.getRecord`)
    url.search = [
      ['repo', did],
      ['collection', CUMULOG_LOG_COLLECTION],
      ['rkey', rkey],
    ].map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')

    const response = await fetcher(url, { signal: timeoutSignal() })
    let body: unknown
    try {
      body = await response.json()
    } catch (cause) {
      if (!response.ok) throw new RecordClientError('failed', cause)
      throw cause
    }
    if (!response.ok) {
      const error = typeof body === 'object' && body !== null && 'error' in body
        ? (body as { error?: unknown }).error
        : undefined
      if (error === 'RecordNotFound') throw new RecordClientError('not-found', body)
      throw new RecordClientError('failed', body)
    }

    if (typeof body !== 'object' || body === null || !('uri' in body) || !('cid' in body)) {
      throw new RecordClientError('failed', new Error('PDS response did not include a record'))
    }
    const record = body as { uri: unknown; cid: unknown; value: unknown }
    if (typeof record.uri !== 'string' || typeof record.cid !== 'string' || !('value' in record)) {
      throw new RecordClientError('failed', new Error('PDS response did not include a record'))
    }
    return parseLogRecord(record.uri, record.cid, record.value)
  } catch (cause) {
    throw classifyError(cause, 'read')
  }
}

export async function resolveOwnerHandle(
  did: string,
  fetcher: typeof fetch = fetch,
): Promise<string | null> {
  try {
    return extractHandle(await resolveDidDocument(did, withTimeout(fetcher)))
  } catch {
    return null
  }
}

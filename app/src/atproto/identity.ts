export const HANDLE_RESOLVER_URL = 'https://bsky.social'
export const PLC_DIRECTORY_URL = 'https://plc.directory'

type DidDocumentService = {
  id?: unknown
  type?: unknown
  serviceEndpoint?: unknown
}

export type DidDocument = {
  id?: unknown
  alsoKnownAs?: unknown
  service?: unknown
}

export class IdentityResolutionError extends Error {
  readonly cause?: unknown
  // 解決先のHTTPステータス（HTTPエラー起因の場合のみ）。404の判定に用いる
  readonly status?: number

  constructor(
    message: string,
    cause?: unknown,
    status?: number,
  ) {
    super(message)
    this.name = 'IdentityResolutionError'
    this.cause = cause
    this.status = status
  }
}

async function fetchJson(url: URL, fetcher: typeof fetch): Promise<unknown> {
  let response: Response
  try {
    response = await fetcher(url, { headers: { accept: 'application/json' } })
  } catch (cause) {
    throw new IdentityResolutionError('ID情報を取得できませんでした', cause)
  }
  if (!response.ok) {
    throw new IdentityResolutionError(
      `ID情報の取得に失敗しました（HTTP ${response.status}）`,
      undefined,
      response.status,
    )
  }
  try {
    return await response.json()
  } catch (cause) {
    throw new IdentityResolutionError('ID情報の応答がJSONではありません', cause)
  }
}

export async function resolveHandle(
  handle: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const normalized = handle.trim().replace(/^@/, '')
  if (!normalized) throw new IdentityResolutionError('handleを入力してください')

  const url = new URL('/xrpc/com.atproto.identity.resolveHandle', HANDLE_RESOLVER_URL)
  url.searchParams.set('handle', normalized)
  const result = await fetchJson(url, fetcher)
  const did = typeof result === 'object' && result !== null && 'did' in result
    ? (result as { did?: unknown }).did
    : undefined
  if (typeof did !== 'string' || !did.startsWith('did:')) {
    throw new IdentityResolutionError('handleからDIDを解決できませんでした')
  }
  return did
}

export function didDocumentUrl(did: string): URL {
  if (did.startsWith('did:plc:')) {
    if (!/^did:plc:[a-z2-7]+$/.test(did)) throw new IdentityResolutionError('did:plcが不正です')
    return new URL(`/${did}`, PLC_DIRECTORY_URL)
  }
  if (did.startsWith('did:web:')) {
    const segments = did.slice('did:web:'.length).split(':').map(decodeURIComponent)
    const host = segments.shift()
    if (!host) throw new IdentityResolutionError('did:webが不正です')
    const path = segments.length === 0
      ? '/.well-known/did.json'
      : `/${segments.map(encodeURIComponent).join('/')}/did.json`
    return new URL(path, `https://${host}`)
  }
  throw new IdentityResolutionError(`未対応のDID methodです: ${did.split(':', 3).slice(0, 2).join(':')}`)
}

export async function resolveDidDocument(
  did: string,
  fetcher: typeof fetch = fetch,
): Promise<DidDocument> {
  const document = await fetchJson(didDocumentUrl(did), fetcher)
  if (typeof document !== 'object' || document === null) {
    throw new IdentityResolutionError('DID documentが不正です')
  }
  return document as DidDocument
}

export function extractPdsServiceEndpoint(document: DidDocument): string {
  if (!Array.isArray(document.service)) {
    throw new IdentityResolutionError('DID documentにserviceがありません')
  }
  const service = (document.service as DidDocumentService[]).find(
    (item) => item?.id === '#atproto_pds' ||
      (typeof item?.id === 'string' && item.id.endsWith('#atproto_pds')),
  )
  if (typeof service?.serviceEndpoint !== 'string') {
    throw new IdentityResolutionError('DID documentに#atproto_pdsがありません')
  }
  return service.serviceEndpoint
}

export function extractHandle(document: DidDocument): string | null {
  if (!Array.isArray(document.alsoKnownAs)) return null
  for (const value of document.alsoKnownAs) {
    if (typeof value === 'string' && value.startsWith('at://')) return value.slice(5)
  }
  return null
}

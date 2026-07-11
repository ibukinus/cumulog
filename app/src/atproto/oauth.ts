import { Agent } from '@atproto/api'
import {
  BrowserOAuthClient,
  type OAuthClientMetadataInput,
  type OAuthSession,
} from '@atproto/oauth-client-browser'

import { CUMULOG_LOG_COLLECTION } from '../domain/types'
import {
  extractHandle,
  extractPdsServiceEndpoint,
  resolveDidDocument,
  resolveHandle,
  type DidDocument,
} from './identity'
import { isBlueskyOfficialPds } from './pds-host'

const PRODUCTION_ORIGIN = 'https://cumulog.mp0.jp'
const HANDLE_RESOLVER = 'https://bsky.social'

// public/client-metadata.json（認可サーバーが取得する静的ファイル）と内容を一致させること
const productionMetadata: OAuthClientMetadataInput = {
  client_id: `${PRODUCTION_ORIGIN}/client-metadata.json`,
  client_name: 'Cumulog',
  client_uri: PRODUCTION_ORIGIN,
  redirect_uris: [`${PRODUCTION_ORIGIN}/oauth/callback`],
  scope: `atproto repo:${CUMULOG_LOG_COLLECTION}`,
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  token_endpoint_auth_method: 'none',
  application_type: 'web',
  dpop_bound_access_tokens: true,
}

export type Session = {
  did: string
  handle: string | null
}

export type AuthInvalidation = {
  did: string
  cause: unknown
}

export class UnsupportedPdsError extends Error {
  readonly did: string
  readonly serviceEndpoint: string

  constructor(
    did: string,
    serviceEndpoint: string,
  ) {
    super('MVPではBluesky公式PDSのアカウントのみ利用できます')
    this.name = 'UnsupportedPdsError'
    this.did = did
    this.serviceEndpoint = serviceEndpoint
  }
}

let oauthClientPromise: Promise<BrowserOAuthClient> | null = null
let oauthSession: OAuthSession | null = null
let sessionInfo: Session | null = null
let signingOutDid: string | null = null
const invalidationListeners = new Set<(event: AuthInvalidation) => void>()

async function createClient(): Promise<BrowserOAuthClient> {
  const options = {
    handleResolver: HANDLE_RESOLVER,
    onDelete: (sub: `did:${string}:${string}`, cause: unknown) => {
      if (signingOutDid === sub) return
      // アクティブなセッションと無関係なsubの削除（古い残骸の掃除等）は失効として扱わない
      if (oauthSession !== null && oauthSession.sub !== sub) return
      if (oauthSession?.sub === sub) {
        oauthSession = null
        sessionInfo = null
      }
      // 原因調査用（トークンは含まれない）。ログイン直後に一度出る場合は旧セッションの掃除で無害
      console.warn('[cumulog] OAuthセッションが削除されました', sub, cause)
      for (const listener of invalidationListeners) {
        listener({ did: sub, cause })
      }
    },
  }
  if (import.meta.env.PROD) {
    return new BrowserOAuthClient({ ...options, clientMetadata: productionMetadata })
  }
  // ループバッククライアントIDはパス成分を含めない制約があるため、現在のページの
  // パスに依存させず固定で組み立てる（/login等でのクライアント生成で壊れないように）
  const port = window.location.port ? `:${window.location.port}` : ''
  const params = new URLSearchParams({
    redirect_uri: `http://127.0.0.1${port}/oauth/callback`,
    scope: productionMetadata.scope ?? 'atproto',
  })
  return BrowserOAuthClient.load({ ...options, clientId: `http://localhost?${params.toString()}` })
}

function getClient(): Promise<BrowserOAuthClient> {
  oauthClientPromise ??= createClient()
  return oauthClientPromise
}

async function toSession(session: OAuthSession): Promise<Session> {
  // handleは表示専用（識別はDID）のため、解決失敗でもセッションは有効として扱う
  try {
    const document = await resolveDidDocument(session.sub)
    return { did: session.sub, handle: extractHandle(document) }
  } catch {
    return { did: session.sub, handle: null }
  }
}

export async function initAuth(): Promise<Session | null> {
  const result = await (await getClient()).init()
  if (!result) {
    oauthSession = null
    sessionInfo = null
    return null
  }
  oauthSession = result.session
  sessionInfo = await toSession(result.session)
  return sessionInfo
}

export async function resolveSignInTarget(
  handle: string,
  fetcher: typeof fetch = fetch,
): Promise<{ did: string; document: DidDocument; serviceEndpoint: string }> {
  const did = await resolveHandle(handle, fetcher)
  const document = await resolveDidDocument(did, fetcher)
  const serviceEndpoint = extractPdsServiceEndpoint(document)
  if (!isBlueskyOfficialPds(serviceEndpoint)) {
    throw new UnsupportedPdsError(did, serviceEndpoint)
  }
  return { did, document, serviceEndpoint }
}

export async function signIn(handle: string): Promise<void> {
  const { did } = await resolveSignInTarget(handle)
  await (await getClient()).signInRedirect(did)
}

export async function signOut(): Promise<void> {
  const session = oauthSession
  oauthSession = null
  sessionInfo = null
  if (!session) return
  signingOutDid = session.sub
  try {
    await (await getClient()).revoke(session.sub)
  } finally {
    signingOutDid = null
  }
}

export function getSession(): Session | null {
  return sessionInfo
}

export function getOAuthSession(): OAuthSession | null {
  return oauthSession
}

export function getAgent(): Agent | null {
  return oauthSession ? new Agent(oauthSession) : null
}

export function getAuthenticatedFetch(): OAuthSession['fetchHandler'] | null {
  return oauthSession?.fetchHandler.bind(oauthSession) ?? null
}

export function onAuthInvalidated(
  listener: (event: AuthInvalidation) => void,
): () => void {
  invalidationListeners.add(listener)
  return () => invalidationListeners.delete(listener)
}

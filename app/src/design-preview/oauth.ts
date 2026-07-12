// design-previewモードで atproto/oauth を差し替えるモック（vite.config.tsのalias参照）。
// 常にログイン済みセッションを返し、ネットワークへは一切出ない。
import type { Agent } from '@atproto/api'

import { PREVIEW_DID, PREVIEW_HANDLE } from './fixtures'

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

  constructor(did: string, serviceEndpoint: string) {
    super('MVPではBluesky公式PDSのアカウントのみ利用できます')
    this.name = 'UnsupportedPdsError'
    this.did = did
    this.serviceEndpoint = serviceEndpoint
  }
}

const previewSession: Session = { did: PREVIEW_DID, handle: PREVIEW_HANDLE }

let createRecordSequence = 0

// Bluesky共有ダイアログ（share.ts経由）の成功フローが動く最小限のAgent
const previewAgent = {
  com: {
    atproto: {
      repo: {
        createRecord: async (input: { collection: string }) => ({
          data: {
            uri: `at://${PREVIEW_DID}/${input.collection}/preview-post-${++createRecordSequence}`,
            cid: `preview-cid-post-${createRecordSequence}`,
          },
        }),
      },
    },
  },
} as unknown as Agent

export async function initAuth(): Promise<Session | null> {
  return previewSession
}

export async function signIn(_handle: string): Promise<void> {
  // 実装の認可リダイレクトを模して全画面遷移し、initAuthから再初期化させる
  window.location.assign('/oauth/callback')
}

export async function signOut(): Promise<void> {}

export function getSession(): Session | null {
  return previewSession
}

export function getAgent(): Agent | null {
  return previewAgent
}

export function onAuthInvalidated(
  _listener: (invalidation: AuthInvalidation) => void,
): () => void {
  return () => {}
}

// design-previewモードで atproto/public を差し替えるモック（vite.config.tsのalias参照）。
// 公開共有ページの取得はrecordsモックと同じストアを読み、作成・編集・削除の結果を反映する。
import type { LogEntry } from '../domain/logs'
import { PREVIEW_HANDLE } from './fixtures'
import { getLog } from './records'

export async function fetchPublicLog(
  did: string,
  rkey: string,
  _fetcher?: typeof fetch,
): Promise<LogEntry> {
  return getLog(null, did, rkey)
}

export async function resolveOwnerHandle(
  _did: string,
  _fetcher?: typeof fetch,
): Promise<string | null> {
  return PREVIEW_HANDLE
}

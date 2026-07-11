/**
 * at-uri（at://did/collection/rkey）からrkeyを取り出す。
 * 形式が想定外の場合はnullを返す。
 */
export function rkeyFromAtUri(uri: string): string | null {
  const match = /^at:\/\/[^/]+\/[^/]+\/([^/]+)$/.exec(uri)
  return match ? match[1] : null
}

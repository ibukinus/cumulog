export const BLUESKY_OFFICIAL_PDS_HOST_PATTERNS = {
  exact: 'bsky.social',
  suffix: '.host.bsky.network',
} as const

export type PdsHostPatterns = {
  exact: string
  suffix: string
}

/**
 * PDSサービスエンドポイントがBluesky公式PDSを指すか判定する。
 */
export function isBlueskyOfficialPds(
  serviceEndpoint: string,
  patterns: PdsHostPatterns = BLUESKY_OFFICIAL_PDS_HOST_PATTERNS,
): boolean {
  let hostname: string

  try {
    hostname = new URL(serviceEndpoint).hostname.toLowerCase()
  } catch {
    return false
  }

  const exactHost = patterns.exact.toLowerCase()
  const hostSuffix = patterns.suffix.toLowerCase()

  return hostname === exactHost || hostname.endsWith(hostSuffix)
}

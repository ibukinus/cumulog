import { describe, expect, it } from 'vitest'

import { isBlueskyOfficialPds } from '../pds-host'

describe('isBlueskyOfficialPds', () => {
  it.each([
    ['https://bsky.social', true],
    ['https://morel.us-east.host.bsky.network', true],
    ['https://shimeji.us-east.host.bsky.network', true],
    ['https://evil-bsky.social', false],
    ['https://bsky.social.evil.com', false],
    ['https://host.bsky.network', false],
    ['https://example.com', false],
    ['https://BSKY.SOCIAL', true],
    ['not a url', false],
  ])('returns %s for %s', (serviceEndpoint, expected) => {
    expect(isBlueskyOfficialPds(serviceEndpoint)).toBe(expected)
  })
})

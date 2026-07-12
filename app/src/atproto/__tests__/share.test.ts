import { type Agent, XRPCError } from '@atproto/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecordClientError } from '../records'
import {
  BSKY_POST_COLLECTION,
  countPostBytes,
  countPostGraphemes,
  createSharePost,
  detectLinkFacets,
  POST_MAX_BYTES,
} from '../share'

const did = 'did:plc:alice'
const headers = {}

function agentWith(createRecord: ReturnType<typeof vi.fn>): Agent {
  return { com: { atproto: { repo: { createRecord } } } } as unknown as Agent
}

function expectKind(kind: RecordClientError['kind']) {
  return expect.objectContaining({ kind })
}

describe('Bluesky share client', () => {
  beforeEach(() => vi.useRealTimers())

  it('counts emoji, ZWJ emoji, and combining characters as graphemes', () => {
    expect(countPostGraphemes('😀')).toBe(1)
    expect(countPostGraphemes('👨‍👩‍👧‍👦')).toBe(1)
    expect(countPostGraphemes('e\u0301')).toBe(1)
    expect(countPostGraphemes('😀👨‍👩‍👧‍👦e\u0301')).toBe(3)
  })

  it('counts UTF-8 bytes', () => {
    expect(countPostBytes('abc')).toBe(3)
    expect(countPostBytes('日本')).toBe(6)
    expect(countPostBytes('😀')).toBe(4)
  })

  it('detects multiple links with UTF-8 byte offsets and excludes punctuation', () => {
    const text = '詳細は https://example.com/道。 次は http://example.org/path?q=1！'

    expect(detectLinkFacets(text)).toEqual([
      {
        index: { byteStart: 10, byteEnd: 33 },
        features: [{
          $type: 'app.bsky.richtext.facet#link',
          uri: 'https://example.com/道',
        }],
      },
      {
        index: { byteStart: 44, byteEnd: 71 },
        features: [{
          $type: 'app.bsky.richtext.facet#link',
          uri: 'http://example.org/path?q=1',
        }],
      },
    ])
  })

  it('returns no facets when text contains no URL', () => {
    expect(detectLinkFacets('今日は散歩しました')).toEqual([])
  })

  it('detects a URL following an opening parenthesis', () => {
    expect(detectLinkFacets('参照(https://example.com)を見た')).toEqual([
      {
        index: { byteStart: 7, byteEnd: 26 },
        features: [{
          $type: 'app.bsky.richtext.facet#link',
          uri: 'https://example.com',
        }],
      },
    ])
  })

  it('keeps balanced parentheses inside a URL', () => {
    const url = 'https://en.wikipedia.org/wiki/Function_(mathematics)'
    expect(detectLinkFacets(`参考: ${url} を読んだ`)).toEqual([
      {
        index: { byteStart: 8, byteEnd: 8 + url.length },
        features: [{
          $type: 'app.bsky.richtext.facet#link',
          uri: url,
        }],
      },
    ])
  })

  it('detects a URL following an opening quotation mark', () => {
    expect(detectLinkFacets('「https://example.com」')).toEqual([
      {
        index: { byteStart: 3, byteEnd: 22 },
        features: [{
          $type: 'app.bsky.richtext.facet#link',
          uri: 'https://example.com',
        }],
      },
    ])
  })

  it('creates a post without a facets key when text has no URL', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-12T12:34:56.789Z'))
    const createRecord = vi.fn().mockResolvedValue({
      success: true,
      headers,
      data: { uri: 'at://did:plc:alice/app.bsky.feed.post/key', cid: 'cid' },
    })

    await expect(createSharePost(agentWith(createRecord), did, '散歩しました')).resolves.toEqual({
      uri: 'at://did:plc:alice/app.bsky.feed.post/key',
    })
    expect(createRecord).toHaveBeenCalledWith({
      repo: did,
      collection: BSKY_POST_COLLECTION,
      record: {
        $type: BSKY_POST_COLLECTION,
        text: '散歩しました',
        langs: ['ja'],
        createdAt: '2026-07-12T12:34:56.789Z',
      },
    }, { signal: expect.any(AbortSignal) })
  })

  it('includes detected facets in the post record', async () => {
    const createRecord = vi.fn().mockResolvedValue({
      success: true,
      headers,
      data: { uri: 'at://created', cid: 'cid' },
    })

    await createSharePost(agentWith(createRecord), did, '参照 https://example.com')
    expect(createRecord).toHaveBeenCalledWith(expect.objectContaining({
      record: expect.objectContaining({
        facets: detectLinkFacets('参照 https://example.com'),
      }),
    }), { signal: expect.any(AbortSignal) })
  })

  it.each([
    ['301 graphemes', 'a'.repeat(301)],
    ['more than 3000 bytes', 'a'.repeat(POST_MAX_BYTES + 1)],
  ])('rejects %s before creating a record', async (_case, text) => {
    const createRecord = vi.fn()
    await expect(createSharePost(agentWith(createRecord), did, text)).rejects.toEqual(expectKind('failed'))
    expect(createRecord).not.toHaveBeenCalled()
  })

  it.each([[401, 'auth-expired'], [403, 'permission']] as const)(
    'classifies HTTP %i as %s',
    async (status, kind) => {
      const createRecord = vi.fn().mockRejectedValue(new XRPCError(status))
      await expect(createSharePost(agentWith(createRecord), did, '共有')).rejects.toEqual(expectKind(kind))
    },
  )

  it('classifies a timeout as maybe-saved', async () => {
    const timeout = new DOMException('The operation timed out', 'TimeoutError')
    const createRecord = vi.fn().mockRejectedValue(timeout)
    await expect(createSharePost(agentWith(createRecord), did, '共有')).rejects.toEqual(expectKind('maybe-saved'))
  })
})

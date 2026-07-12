import { type Agent } from '@atproto/api'

import { classifyError, RecordClientError, timeoutSignal } from './records'

export const BSKY_POST_COLLECTION = 'app.bsky.feed.post'

// Bluesky投稿の書記素上限（design/05-data-flow.md）
export const POST_MAX_GRAPHEMES = 300
export const POST_MAX_BYTES = 3000

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export function countPostGraphemes(text: string): number {
  return Array.from(graphemeSegmenter.segment(text)).length
}

export function countPostBytes(text: string): number {
  return textEncoder.encode(text).length
}

export type LinkFacet = {
  index: { byteStart: number; byteEnd: number }
  features: [{ $type: 'app.bsky.richtext.facet#link'; uri: string }]
}

const textEncoder = new TextEncoder()

const closerToOpener: Record<string, string> = {
  ')': '(',
  ']': '[',
  '）': '（',
  '}': '{',
  '】': '【',
  '」': '「',
  '』': '『',
  '〉': '〈',
  '》': '《',
}
const openers = new Set(Object.values(closerToOpener))

// URL内に対応する開き括弧が無い閉じ括弧は、文側の括弧（例:「参照(URL)を見た」）を
// 巻き込んだものとみなし、その位置でURLを打ち切る。URL自身の対応括弧
// （例: Wikipediaの「_(mathematics)」）は保持する
function truncateAtUnmatchedCloser(candidate: string): string {
  const depths = new Map<string, number>()
  for (let i = 0; i < candidate.length; i++) {
    const char = candidate[i]
    if (openers.has(char)) depths.set(char, (depths.get(char) ?? 0) + 1)
    const opener = closerToOpener[char]
    if (opener !== undefined) {
      const depth = depths.get(opener) ?? 0
      if (depth === 0) return candidate.slice(0, i)
      depths.set(opener, depth - 1)
    }
  }
  return candidate
}

const trailingUrlPunctuation = /[。、．，,.!?！？;:；：'"]+$/u

export function detectLinkFacets(text: string): LinkFacet[] {
  const facets: LinkFacet[] = []

  for (const match of text.matchAll(/https?:\/\/\S+/gu)) {
    const uri = truncateAtUnmatchedCloser(match[0]).replace(trailingUrlPunctuation, '')
    try {
      new URL(uri)
    } catch {
      continue
    }

    const characterStart = match.index
    const byteStart = textEncoder.encode(text.slice(0, characterStart)).length
    facets.push({
      index: {
        byteStart,
        byteEnd: byteStart + textEncoder.encode(uri).length,
      },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri }],
    })
  }

  return facets
}

export async function createSharePost(
  agent: Agent,
  did: string,
  text: string,
): Promise<{ uri: string }> {
  if (
    countPostGraphemes(text) > POST_MAX_GRAPHEMES
    || countPostBytes(text) > POST_MAX_BYTES
  ) {
    throw new RecordClientError('failed')
  }

  const facets = detectLinkFacets(text)
  try {
    const response = await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: BSKY_POST_COLLECTION,
      record: {
        $type: BSKY_POST_COLLECTION,
        text,
        ...(facets.length === 0 ? {} : { facets }),
        langs: ['ja'],
        createdAt: new Date().toISOString(),
      },
    }, { signal: timeoutSignal() })
    return { uri: response.data.uri }
  } catch (cause) {
    throw classifyError(cause, 'write')
  }
}

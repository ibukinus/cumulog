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

const trailingUrlPunctuation = /[。、．，,.)\]）}】」』〉》!?！？]+$/u
const textEncoder = new TextEncoder()

export function detectLinkFacets(text: string): LinkFacet[] {
  const facets: LinkFacet[] = []

  for (const match of text.matchAll(/https?:\/\/[^\s)\]）}】」』〉》]+/gu)) {
    const uri = match[0].replace(trailingUrlPunctuation, '')
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

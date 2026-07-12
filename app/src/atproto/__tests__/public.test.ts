import { describe, expect, it, vi } from 'vitest'

import { CUMULOG_LOG_COLLECTION } from '../../domain/types'
import { fetchPublicLog, resolveOwnerHandle } from '../public'
import { RecordClientError } from '../records'

const did = 'did:plc:alice'
const pds = 'https://pds.example'
const document = {
  alsoKnownAs: ['at://alice.example'],
  service: [{ id: '#atproto_pds', serviceEndpoint: pds }],
}
const value = {
  $type: CUMULOG_LOG_COLLECTION,
  title: '散歩',
  activityDate: '2026-07-11',
  spoiler: 'none',
  createdAt: '2026-07-11T00:00:00.000Z',
}

function fetcherWithRecord(body: unknown, status = 200) {
  return vi.fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(JSON.stringify(document), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
}

describe('public record client', () => {
  it('resolves the DID and fetches a public record without auth', async () => {
    const fetcher = fetcherWithRecord({ uri: 'at://alice/log/key', cid: 'cid-key', value })

    await expect(fetchPublicLog(did, 'key', fetcher)).resolves.toEqual({
      kind: 'readable',
      uri: 'at://alice/log/key',
      cid: 'cid-key',
      record: value,
    })
    const [url, options] = fetcher.mock.calls[1]
    expect(String(url)).toBe(
      `https://pds.example/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=${CUMULOG_LOG_COLLECTION}&rkey=key`,
    )
    expect(options).toEqual({ signal: expect.any(AbortSignal) })
  })

  it('classifies RecordNotFound as not-found', async () => {
    const fetcher = fetcherWithRecord({ error: 'RecordNotFound' }, 400)
    await expect(fetchPublicLog(did, 'missing', fetcher)).rejects.toEqual(
      expect.objectContaining({ kind: 'not-found' }),
    )
  })

  it('classifies network errors and timeouts as failed', async () => {
    const network = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(document)))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(fetchPublicLog(did, 'key', network)).rejects.toEqual(
      expect.objectContaining({ kind: 'failed' }),
    )

    const timeout = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(document)))
      .mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'))
    await expect(fetchPublicLog(did, 'key', timeout)).rejects.toEqual(
      expect.objectContaining({ kind: 'failed' }),
    )
  })

  it('returns an unreadable entry for an invalid record value', async () => {
    const fetcher = fetcherWithRecord({ uri: 'at://alice/log/key', cid: 'cid-key', value: { title: 1 } })
    await expect(fetchPublicLog(did, 'key', fetcher)).resolves.toEqual({
      kind: 'unreadable', uri: 'at://alice/log/key', cid: 'cid-key',
    })
  })

  it('resolves the owner handle and returns null when resolution fails', async () => {
    const success = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(document)))
    await expect(resolveOwnerHandle(did, success)).resolves.toBe('alice.example')

    const failure = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'))
    await expect(resolveOwnerHandle(did, failure)).resolves.toBeNull()
  })

  it('classifies a missing DID document as not-found', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 404 }))
    const error = await fetchPublicLog(did, 'key', fetcher).catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(RecordClientError)
    expect(error).toEqual(expect.objectContaining({ kind: 'not-found' }))
  })
})

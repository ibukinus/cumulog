import { describe, expect, it, vi } from 'vitest'

import { resolveSignInTarget, UnsupportedPdsError } from '../oauth'

describe('sign-in PDS validation', () => {
  it('rejects an unsupported PDS before authorization', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ did: 'did:plc:alice' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'did:plc:alice',
        service: [{ id: '#atproto_pds', serviceEndpoint: 'https://pds.example.com' }],
      })))

    const error = await resolveSignInTarget('alice.example', fetcher).catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(UnsupportedPdsError)
    expect(error).toMatchObject({
      did: 'did:plc:alice',
      serviceEndpoint: 'https://pds.example.com',
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})

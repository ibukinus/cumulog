import { describe, expect, it, vi } from 'vitest'

import {
  didDocumentUrl,
  extractHandle,
  extractPdsServiceEndpoint,
  resolveHandle,
} from '../identity'

describe('identity resolution', () => {
  it('extracts the PDS endpoint and display handle from a DID document', () => {
    const document = {
      alsoKnownAs: ['at://alice.example'],
      service: [{
        id: 'did:plc:alice#atproto_pds',
        type: 'AtprotoPersonalDataServer',
        serviceEndpoint: 'https://morel.us-east.host.bsky.network',
      }],
    }
    expect(extractPdsServiceEndpoint(document)).toBe('https://morel.us-east.host.bsky.network')
    expect(extractHandle(document)).toBe('alice.example')
  })

  it('builds standard did:plc and did:web document URLs', () => {
    expect(didDocumentUrl('did:plc:abc').href).toBe('https://plc.directory/did:plc:abc')
    expect(didDocumentUrl('did:web:example.com').href).toBe('https://example.com/.well-known/did.json')
    expect(didDocumentUrl('did:web:example.com:users:alice').href).toBe('https://example.com/users/alice/did.json')
  })

  it('resolves a normalized handle with the public XRPC resolver', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ did: 'did:plc:alice' }), { status: 200 }),
    )
    await expect(resolveHandle('@alice.example', fetcher)).resolves.toBe('did:plc:alice')
    expect(fetcher).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining('handle=alice.example') }),
      expect.anything(),
    )
  })
})

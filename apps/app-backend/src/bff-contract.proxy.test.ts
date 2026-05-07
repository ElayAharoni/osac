import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from './app.js'

const UPSTREAM = 'https://fulfillment.test.example'

describe('BFF dev proxy (integration contract)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('forwards GET /api/fulfillment/v1/* to FULFILLMENT_API_URL with Authorization', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe(`${UPSTREAM}/api/fulfillment/v1/capabilities`)
      expect(init?.headers).toBeDefined()
      const headers = new Headers(init?.headers as HeadersInit)
      expect(headers.get('Authorization')).toBe('Bearer test-jwt')
      return new Response(JSON.stringify({ authn: { trustedTokenIssuers: [] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const app = await buildApp({
      apiMode: 'dev',
      fulfillmentApiUrl: UPSTREAM,
      logger: false,
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/fulfillment/v1/capabilities',
      headers: { authorization: 'Bearer test-jwt' },
    })
    expect(res.statusCode).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(res.headers['content-type']).toContain('application/json')
    await app.close()
  })

  it('forwards GET /api/events/v1/* to upstream', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ items: [], size: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const app = await buildApp({
      apiMode: 'dev',
      fulfillmentApiUrl: UPSTREAM,
      logger: false,
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/events/v1/events',
      headers: { authorization: 'Bearer t' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/json')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [eventsUrl] = fetchMock.mock.calls[0] as unknown as [string]
    expect(String(eventsUrl)).toBe(`${UPSTREAM}/api/events/v1/events`)
    await app.close()
  })

  it('forwards GET /api/osac/public/v1/* to upstream', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ available: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const app = await buildApp({
      apiMode: 'dev',
      fulfillmentApiUrl: UPSTREAM,
      logger: false,
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/osac/public/v1/console/CONSOLE_RESOURCE_TYPE_COMPUTE_INSTANCE/x/access',
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/json')
    const [consoleUrl] = fetchMock.mock.calls[0] as unknown as [string]
    expect(String(consoleUrl)).toBe(
      `${UPSTREAM}/api/osac/public/v1/console/CONSOLE_RESOURCE_TYPE_COMPUTE_INSTANCE/x/access`,
    )
    await app.close()
  })

  it('proxies non-JSON upstream responses without parsing (status + content-type)', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('not-json', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const app = await buildApp({
      apiMode: 'dev',
      fulfillmentApiUrl: UPSTREAM,
      logger: false,
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/events/v1/events',
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/plain')
    // light-my-request does not aggregate Node streams from reply.send(Readable); assert wiring only.
    expect(fetchMock).toHaveBeenCalled()
    await app.close()
  })
})

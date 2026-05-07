import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from './app.js'
import { resetMockVmStore } from './mock-vm-store.js'

describe('BFF mock mode (integration contract)', () => {
  afterEach(() => {
    resetMockVmStore()
  })

  it('GET /health reports mode=mock', async () => {
    const app = await buildApp({ apiMode: 'mock', logger: false })
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok', mode: 'mock' })
    await app.close()
  })

  it('GET /api/fulfillment/v1/capabilities matches stub shape (trustedTokenIssuers array)', async () => {
    const app = await buildApp({ apiMode: 'mock', logger: false })
    const res = await app.inject({ method: 'GET', url: '/api/fulfillment/v1/capabilities' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { authn: { trustedTokenIssuers: unknown[] } }
    expect(body).toHaveProperty('authn')
    expect(Array.isArray(body.authn.trustedTokenIssuers)).toBe(true)
    await app.close()
  })

  it('GET /api/fulfillment/v1/cluster_templates returns page envelope', async () => {
    const app = await buildApp({ apiMode: 'mock', logger: false })
    const res = await app.inject({ method: 'GET', url: '/api/fulfillment/v1/cluster_templates' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { size: number; total: number; items: unknown[] }
    expect(typeof body.size).toBe('number')
    expect(typeof body.total).toBe('number')
    expect(Array.isArray(body.items)).toBe(true)
    await app.close()
  })

  it('GET /api/events/v1/events returns paginated mock feed', async () => {
    const app = await buildApp({ apiMode: 'mock', logger: false })
    const res = await app.inject({ method: 'GET', url: '/api/events/v1/events?limit=5&offset=0' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { size: number; total: number; items: unknown[] }
    expect(body.size).toBe(5)
    expect(body.total).toBeGreaterThan(0)
    expect(body.items).toHaveLength(5)
    await app.close()
  })

  it('GET console access returns availability envelope', async () => {
    const app = await buildApp({ apiMode: 'mock', logger: false })
    const res = await app.inject({
      method: 'GET',
      url: '/api/osac/public/v1/console/CONSOLE_RESOURCE_TYPE_COMPUTE_INSTANCE/vm-1/access',
    })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { available: boolean; supportedTypes: string[] }
    expect(body.available).toBe(true)
    expect(body.supportedTypes).toContain('serial')
    await app.close()
  })
})

/**
 * BFF fulfillment routes — proxy to FULFILLMENT_API_URL when set; mock otherwise.
 *
 * Mock paths:
 *   GET  /api/fulfillment/v1/capabilities           → mock capabilities
 *   GET  /api/fulfillment/v1/cluster_templates       → mock template list
 *   GET  /api/fulfillment/v1/cluster_templates/:id   → mock template detail
 *   GET  /api/fulfillment/v1/compute_instances       → mock VM list
 *   GET  /api/fulfillment/v1/compute_instances/:id   → mock VM detail
 *   POST /api/fulfillment/v1/compute_instances       → mock VM create
 *   PATCH /api/fulfillment/v1/compute_instances/:id  → mock VM update
 *   DELETE /api/fulfillment/v1/compute_instances/:id → mock VM delete
 *   GET  /api/fulfillment/v1/organizations           → mock org list
 *   GET  /api/fulfillment/v1/clusters                → mock cluster list
 *   GET  /api/fulfillment/v1/virtual_networks        → mock VN list
 *   GET  /api/fulfillment/v1/subnets                 → mock subnet list
 *   GET  /api/fulfillment/v1/security_groups         → mock SG list
 */
import type { FastifyInstance } from 'fastify'
import { VM_TEMPLATES, buildVmsForTenant, DEMO_ORGANIZATIONS } from '@osac/api-contracts'
import type { ComputeInstance } from '@osac/api-contracts'

interface RouteConfig {
  apiMode: string
  fulfillmentApiUrl?: string
}

const allMockVms: ComputeInstance[] = [
  ...buildVmsForTenant('northstar'),
  ...buildVmsForTenant('evergreen'),
]

const vmStore = new Map<string, ComputeInstance>(allMockVms.map((vm) => [vm.id, vm]))

export async function registerFulfillmentRoutes(app: FastifyInstance, config: RouteConfig) {
  const { apiMode, fulfillmentApiUrl } = config
  const prefix = '/api/fulfillment/v1'

  if (apiMode === 'dev' && fulfillmentApiUrl) {
    // In proxy mode, forward requests to upstream
    app.all(`${prefix}/*`, async (req, reply) => {
      const upstreamUrl = `${fulfillmentApiUrl}${req.url}`
      const headers: Record<string, string> = {}
      if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization
      }
      const res = await fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      })
      const body = await res.json()
      reply.status(res.status).send(body)
    })
    return
  }

  // -------------------------------------------------------------------------
  // Mock handlers
  // -------------------------------------------------------------------------

  app.get(`${prefix}/capabilities`, async () => ({
    authn: {
      trustedTokenIssuers: [],
    },
  }))

  app.get(`${prefix}/cluster_templates`, async (req) => {
    const query = req.query as { filter?: string; limit?: string; offset?: string }
    const limit = parseInt(query.limit ?? '50', 10)
    const offset = parseInt(query.offset ?? '0', 10)
    const filter = query.filter?.toLowerCase() ?? ''
    const filtered = filter
      ? VM_TEMPLATES.filter(
          (t) =>
            t.title.toLowerCase().includes(filter) ||
            (t.description ?? '').toLowerCase().includes(filter),
        )
      : VM_TEMPLATES
    const page = filtered.slice(offset, offset + limit)
    return { size: page.length, total: filtered.length, items: page }
  })

  app.get(`${prefix}/cluster_templates/:id`, async (req, reply) => {
    const { id } = req.params as { id: string }
    const tpl = VM_TEMPLATES.find((t) => t.id === id)
    if (!tpl) return reply.status(404).send({ error: 'Not found' })
    return tpl
  })

  app.get(`${prefix}/compute_instance_templates`, async () => {
    return { size: VM_TEMPLATES.length, total: VM_TEMPLATES.length, items: VM_TEMPLATES }
  })

  app.get(`${prefix}/compute_instances`, async (req) => {
    const query = req.query as { filter?: string; limit?: string; offset?: string }
    const limit = parseInt(query.limit ?? '100', 10)
    const offset = parseInt(query.offset ?? '0', 10)
    const filter = query.filter?.toLowerCase() ?? ''
    const all = Array.from(vmStore.values())
    const filtered = filter
      ? all.filter(
          (vm) =>
            vm.metadata.name.toLowerCase().includes(filter) ||
            vm.status.state.toLowerCase().includes(filter),
        )
      : all
    const page = filtered.slice(offset, offset + limit)
    return { size: page.length, total: filtered.length, items: page }
  })

  app.get(`${prefix}/compute_instances/:id`, async (req, reply) => {
    const { id } = req.params as { id: string }
    const vm = vmStore.get(id)
    if (!vm) return reply.status(404).send({ error: 'Not found' })
    return vm
  })

  app.post(`${prefix}/compute_instances`, async (req, reply) => {
    const body = req.body as { object?: ComputeInstance }
    if (!body?.object) return reply.status(400).send({ error: 'Missing object' })
    const vm: ComputeInstance = {
      ...body.object,
      id: `vm-created-${Date.now()}`,
      status: { state: 'starting' },
      metadata: { ...body.object.metadata, createdAt: new Date().toISOString() },
    }
    vmStore.set(vm.id, vm)
    return { object: vm }
  })

  app.patch(`${prefix}/compute_instances/:id`, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = vmStore.get(id)
    if (!existing) return reply.status(404).send({ error: 'Not found' })
    const body = req.body as Partial<ComputeInstance>
    const updated: ComputeInstance = {
      ...existing,
      ...body,
      spec: { ...existing.spec, ...(body.spec ?? {}) },
      status: { ...existing.status, ...(body.status ?? {}) },
      metadata: { ...existing.metadata, ...(body.metadata ?? {}) },
    }
    vmStore.set(id, updated)
    return { object: updated }
  })

  app.delete(`${prefix}/compute_instances/:id`, async (req, reply) => {
    const { id } = req.params as { id: string }
    if (!vmStore.has(id)) return reply.status(404).send({ error: 'Not found' })
    vmStore.delete(id)
    return {}
  })

  app.get(`${prefix}/organizations`, async () => {
    return {
      size: DEMO_ORGANIZATIONS.length,
      total: DEMO_ORGANIZATIONS.length,
      items: DEMO_ORGANIZATIONS,
    }
  })

  app.get(`${prefix}/clusters`, async () => {
    return {
      size: 2,
      total: 2,
      items: DEMO_ORGANIZATIONS.map((o) => ({ id: o.id, name: o.displayName })),
    }
  })

  app.get(`${prefix}/virtual_networks`, async () => {
    const items = [
      { id: 'vn-prod', name: 'prod-network', cidr: '10.10.0.0/16' },
      { id: 'vn-dev', name: 'dev-network', cidr: '10.20.0.0/16' },
      { id: 'vn-mgmt', name: 'mgmt-network', cidr: '10.30.0.0/16' },
    ]
    return { size: items.length, total: items.length, items }
  })

  app.get(`${prefix}/subnets`, async () => {
    const items = [
      { id: 'sn-prod-1a', name: 'prod-east-1a', cidr: '10.10.1.0/24' },
      { id: 'sn-prod-1b', name: 'prod-east-1b', cidr: '10.10.2.0/24' },
      { id: 'sn-dev-1a', name: 'dev-east-1a', cidr: '10.20.1.0/24' },
    ]
    return { size: items.length, total: items.length, items }
  })

  app.get(`${prefix}/security_groups`, async () => {
    const items = [
      { id: 'sg-web', name: 'web-servers', description: 'HTTP/HTTPS inbound' },
      { id: 'sg-db', name: 'database', description: 'DB port inbound from app tier' },
      { id: 'sg-mgmt', name: 'management', description: 'SSH from bastion only' },
    ]
    return { size: items.length, total: items.length, items }
  })
}

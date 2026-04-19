/** Mock event feed — GET /api/events/v1/events */
import type { FastifyInstance } from 'fastify'

interface RouteConfig {
  apiMode: string
}

const MOCK_EVENTS = Array.from({ length: 50 }, (_, i) => ({
  id: `event-${i}`,
  type: ['VM_STARTED', 'VM_STOPPED', 'VM_PROVISIONED', 'SNAPSHOT_CREATED'][i % 4],
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  message: `Demo event ${i + 1}`,
  severity: ['info', 'success', 'warning', 'info'][i % 4],
}))

export async function registerEventsRoutes(app: FastifyInstance, _config: RouteConfig) {
  app.get('/api/events/v1/events', async (req) => {
    const query = req.query as { limit?: string; offset?: string }
    const limit = parseInt(query.limit ?? '20', 10)
    const offset = parseInt(query.offset ?? '0', 10)
    const page = MOCK_EVENTS.slice(offset, offset + limit)
    return { size: page.length, total: MOCK_EVENTS.length, items: page }
  })
}

/** Mock console access — GET /api/osac/public/v1/console/:resourceType/:resourceId/access */
import type { FastifyInstance } from 'fastify'
import { proxyToUpstream } from './upstreamProxy.js'

interface RouteConfig {
  apiMode: string
  fulfillmentApiUrl?: string
}

export async function registerConsoleRoutes(app: FastifyInstance, config: RouteConfig) {
  const { apiMode, fulfillmentApiUrl } = config

  if (apiMode === 'dev' && fulfillmentApiUrl) {
    app.all('/api/osac/public/v1/*', async (req, reply) => {
      await proxyToUpstream(req, reply, fulfillmentApiUrl)
    })
    return
  }

  app.get('/api/osac/public/v1/console/:resourceType/:resourceId/access', async (req) => {
    const { resourceType } = req.params as { resourceType: string; resourceId: string }
    const available =
      resourceType === 'CONSOLE_RESOURCE_TYPE_COMPUTE_INSTANCE' ||
      resourceType === 'COMPUTE_INSTANCE_RESOURCE_TYPE_COMPUTE_INSTANCE'
    return {
      available,
      reason: available ? undefined : 'Resource type not supported for console access',
      supportedTypes: available ? ['serial', 'vnc'] : [],
    }
  })
}

/** Mock console access — GET /api/osac/public/v1/console/:resourceType/:resourceId/access */
import type { FastifyInstance } from 'fastify'

interface RouteConfig {
  apiMode: string
}

export async function registerConsoleRoutes(app: FastifyInstance, _config: RouteConfig) {
  app.get(
    '/api/osac/public/v1/console/:resourceType/:resourceId/access',
    async (req) => {
      const { resourceType } = req.params as { resourceType: string; resourceId: string }
      const available =
        resourceType === 'CONSOLE_RESOURCE_TYPE_COMPUTE_INSTANCE' ||
        resourceType === 'COMPUTE_INSTANCE_RESOURCE_TYPE_COMPUTE_INSTANCE'
      return {
        available,
        reason: available ? undefined : 'Resource type not supported for console access',
        supportedTypes: available ? ['serial', 'vnc'] : [],
      }
    },
  )
}

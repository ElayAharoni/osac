/**
 * Composable Fastify app — used by src/index.ts (listen) and Vitest (inject).
 */
import Fastify, { type FastifyServerOptions } from 'fastify'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { registerFulfillmentRoutes } from './routes/fulfillment.js'
import { registerEventsRoutes } from './routes/events.js'
import { registerConsoleRoutes } from './routes/console.js'
import { registerCreateVmWizardRoutes } from './routes/createVmWizard.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export interface BuildAppOptions {
  apiMode: string
  fulfillmentApiUrl?: string
  /** When true, register static + SPA fallback if ../public exists (production image). */
  enableSpaStatic?: boolean
  nodeEnv?: string
  logger?: FastifyServerOptions['logger']
}

export async function buildApp(options: BuildAppOptions) {
  const {
    apiMode,
    fulfillmentApiUrl,
    enableSpaStatic = false,
    nodeEnv = process.env.NODE_ENV,
    logger = false,
  } = options

  const app = Fastify({ logger })

  await app.register(cors, {
    origin: nodeEnv === 'production' ? false : true,
    credentials: true,
  })

  app.get('/health', async () => ({ status: 'ok', mode: apiMode }))
  app.get('/ready', async () => ({ status: 'ready' }))

  await registerFulfillmentRoutes(app, { apiMode, fulfillmentApiUrl })
  await registerEventsRoutes(app, { apiMode, fulfillmentApiUrl })
  await registerConsoleRoutes(app, { apiMode, fulfillmentApiUrl })
  await registerCreateVmWizardRoutes(app)

  const spaDistDir = join(__dirname, '..', 'public')
  if (enableSpaStatic && existsSync(spaDistDir)) {
    await app.register(staticFiles, {
      root: spaDistDir,
      prefix: '/',
    })
    app.setNotFoundHandler(async (_req, reply) => {
      return reply.sendFile('index.html')
    })
  }

  return app
}

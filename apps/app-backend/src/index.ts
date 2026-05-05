import Fastify from 'fastify'
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

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const HOST = process.env.HOST ?? '0.0.0.0'
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info'
const API_MODE = process.env.OSAC_API_MODE ?? 'mock'
const FULFILLMENT_API_URL = process.env.FULFILLMENT_API_URL?.trim()

const app = Fastify({ logger: { level: LOG_LEVEL } })

await app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true,
})

// Health / readiness probes
app.get('/health', async () => ({ status: 'ok', mode: API_MODE }))
app.get('/ready', async () => ({ status: 'ready' }))

// BFF API routes
await registerFulfillmentRoutes(app, { apiMode: API_MODE, fulfillmentApiUrl: FULFILLMENT_API_URL })
await registerEventsRoutes(app, { apiMode: API_MODE })
await registerConsoleRoutes(app, { apiMode: API_MODE })
await registerCreateVmWizardRoutes(app)

// Serve embedded SPA in production
const spaDistDir = join(__dirname, '..', 'public')
if (existsSync(spaDistDir)) {
  await app.register(staticFiles, {
    root: spaDistDir,
    prefix: '/',
  })

  // SPA fallback — all non-API routes return index.html
  app.setNotFoundHandler(async (_req, reply) => {
    return reply.sendFile('index.html')
  })
}

try {
  await app.listen({ port: PORT, host: HOST })
  app.log.info(`OSAC BFF running at http://${HOST}:${PORT} [mode=${API_MODE}]`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

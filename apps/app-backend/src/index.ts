import type { LogLevel } from 'fastify'
import { buildApp } from './app.js'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const HOST = process.env.HOST ?? '0.0.0.0'
const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info') as LogLevel
const API_MODE = process.env.OSAC_API_MODE ?? 'mock'
const FULFILLMENT_API_URL = process.env.FULFILLMENT_API_URL?.trim()

const app = await buildApp({
  apiMode: API_MODE,
  fulfillmentApiUrl: FULFILLMENT_API_URL,
  enableSpaStatic: true,
  nodeEnv: process.env.NODE_ENV,
  logger: { level: LOG_LEVEL },
})

try {
  await app.listen({ port: PORT, host: HOST })
  app.log.info(`OSAC BFF running at http://${HOST}:${PORT} [mode=${API_MODE}]`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

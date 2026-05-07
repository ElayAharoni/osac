import { Readable } from 'node:stream'
import type { ReadableStream as WebReadableStream } from 'node:stream/web'
import type { FastifyReply, FastifyRequest } from 'fastify'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'host',
])

function appendRequestHeaders(req: FastifyRequest): Headers {
  const headers = new Headers()
  for (const [name, rawValue] of Object.entries(req.headers)) {
    if (rawValue == null) continue
    const normalized = name.toLowerCase()
    if (normalized === 'host' || normalized === 'content-length') continue
    if (Array.isArray(rawValue)) {
      for (const value of rawValue) headers.append(name, value)
      continue
    }
    headers.set(name, rawValue)
  }
  return headers
}

function copyResponseHeaders(reply: FastifyReply, upstream: Response): void {
  upstream.headers.forEach((value, name) => {
    if (HOP_BY_HOP_HEADERS.has(name.toLowerCase())) return
    reply.header(name, value)
  })
}

export async function proxyToUpstream(
  req: FastifyRequest,
  reply: FastifyReply,
  upstreamBaseUrl: string,
): Promise<void> {
  const upstreamUrl = new URL(req.url, upstreamBaseUrl).toString()
  const method = req.method.toUpperCase()
  const body =
    method === 'GET' || method === 'HEAD' || req.body == null ? undefined : JSON.stringify(req.body)

  const upstream = await fetch(upstreamUrl, {
    method,
    headers: appendRequestHeaders(req),
    body,
  })

  copyResponseHeaders(reply, upstream)
  reply.status(upstream.status)

  if (upstream.body == null) {
    reply.send()
    return
  }

  reply.send(Readable.fromWeb(upstream.body as unknown as WebReadableStream))
}

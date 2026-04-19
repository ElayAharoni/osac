/**
 * BFF API client — always routes through /api on the same origin.
 * Vite dev server proxies /api → backend:3001.
 * In production the BFF serves both the SPA and the API.
 */
import type { ComputeInstance, ClusterTemplate, PageOfT } from '@osac/api-contracts'

const BASE = '/api/fulfillment/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Compute instances
// ---------------------------------------------------------------------------

export interface ListComputeInstancesParams {
  filter?: string
  limit?: number
  offset?: number
}

export function listComputeInstances(
  params: ListComputeInstancesParams = {},
): Promise<PageOfT<ComputeInstance>> {
  const q = new URLSearchParams()
  if (params.filter) q.set('filter', params.filter)
  if (params.limit != null) q.set('limit', String(params.limit))
  if (params.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return request<PageOfT<ComputeInstance>>(`/compute_instances${qs ? `?${qs}` : ''}`)
}

export function getComputeInstance(id: string): Promise<ComputeInstance> {
  return request<ComputeInstance>(`/compute_instances/${id}`)
}

export function createComputeInstance(vm: Partial<ComputeInstance>): Promise<ComputeInstance> {
  return request<ComputeInstance>('/compute_instances', {
    method: 'POST',
    body: JSON.stringify(vm),
  })
}

export function patchComputeInstance(
  id: string,
  patch: Partial<ComputeInstance>,
): Promise<ComputeInstance> {
  return request<ComputeInstance>(`/compute_instances/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteComputeInstance(id: string): Promise<void> {
  return request<void>(`/compute_instances/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Cluster templates
// ---------------------------------------------------------------------------

export interface ListTemplatesParams {
  filter?: string
  limit?: number
  offset?: number
}

export function listClusterTemplates(
  params: ListTemplatesParams = {},
): Promise<PageOfT<ClusterTemplate>> {
  const q = new URLSearchParams()
  if (params.filter) q.set('filter', params.filter)
  if (params.limit != null) q.set('limit', String(params.limit))
  if (params.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return request<PageOfT<ClusterTemplate>>(`/cluster_templates${qs ? `?${qs}` : ''}`)
}

export function getClusterTemplate(id: string): Promise<ClusterTemplate> {
  return request<ClusterTemplate>(`/cluster_templates/${id}`)
}

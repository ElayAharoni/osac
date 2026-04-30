import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ComputeInstance, ClusterTemplate } from '@osac/api-contracts'
import {
  listComputeInstances,
  listClusterTemplates,
  createComputeInstance,
  patchComputeInstance,
  type ListComputeInstancesParams,
  type ListTemplatesParams,
} from './client'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const queryKeys = {
  computeInstances: (params?: ListComputeInstancesParams) =>
    ['compute_instances', params ?? {}] as const,
  clusterTemplates: (params?: ListTemplatesParams) => ['cluster_templates', params ?? {}] as const,
}

// ---------------------------------------------------------------------------
// Compute instances
// ---------------------------------------------------------------------------

export function useComputeInstances(params: ListComputeInstancesParams = {}) {
  return useQuery({
    queryKey: queryKeys.computeInstances(params),
    queryFn: () => listComputeInstances(params),
    staleTime: 30_000,
    select: (data) => data.items,
  })
}

export function useProvisionVm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vm: Partial<ComputeInstance>) => createComputeInstance(vm),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['compute_instances'] })
    },
  })
}

export function usePatchVm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ComputeInstance> }) =>
      patchComputeInstance(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['compute_instances'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Cluster templates
// ---------------------------------------------------------------------------

export function useClusterTemplates(params: ListTemplatesParams = {}) {
  return useQuery({
    queryKey: queryKeys.clusterTemplates(params),
    queryFn: () => listClusterTemplates(params),
    staleTime: 60_000,
    select: (data) => data.items,
  })
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** Returns (running, paused, stopped) counts derived from a VM list */
export function useVmPowerCounts(params: ListComputeInstancesParams = {}) {
  return useQuery({
    queryKey: queryKeys.computeInstances(params),
    queryFn: () => listComputeInstances(params),
    staleTime: 30_000,
    select: (data) => {
      const counts = { running: 0, paused: 0, stopped: 0, total: data.total }
      for (const vm of data.items) {
        const s = vm.status.state
        if (s === 'running') counts.running++
        else if (s === 'paused') counts.paused++
        else counts.stopped++
      }
      return counts
    },
  })
}

// Re-export template type for convenience
export type { ComputeInstance, ClusterTemplate }

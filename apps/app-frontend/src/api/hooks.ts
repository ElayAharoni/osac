import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ComputeInstance, ClusterTemplate } from '@osac/api-contracts'
import {
  listComputeInstances,
  listComputeInstanceTemplates,
  createComputeInstance,
  patchComputeInstance,
  type ListComputeInstancesParams,
} from './client'

/** Poll VM list so CLI / out-of-band server changes update dashboard + My VMs without a full reload. */
const COMPUTE_INSTANCES_REFETCH_MS = 30_000
/** Templates change less often than VM state; still refresh catalog / wizard. */
const COMPUTE_INSTANCE_TEMPLATES_REFETCH_MS = 60_000

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const queryKeys = {
  computeInstances: (params?: ListComputeInstancesParams) =>
    ['compute_instances', params ?? {}] as const,
  /** Shared VM template list — CatalogPage + wizard TemplateStep (template-catalog-wizard-api-alignment). */
  computeInstanceTemplates: ['compute_instance_templates'] as const,
}

// ---------------------------------------------------------------------------
// Compute instances
// ---------------------------------------------------------------------------

export function useComputeInstances(params: ListComputeInstancesParams = {}) {
  return useQuery({
    queryKey: queryKeys.computeInstances(params),
    queryFn: () => listComputeInstances(params),
    staleTime: 30_000,
    refetchInterval: COMPUTE_INSTANCES_REFETCH_MS,
    refetchIntervalInBackground: false,
    select: (data) => data.items,
  })
}

export type ProvisionVmInput = {
  vm: Partial<ComputeInstance>
  /** When true, POST body must include `spec.template`; other set `spec` fields are still serialized. */
  specTemplateOnly?: boolean
}

export function useProvisionVm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vm, specTemplateOnly }: ProvisionVmInput) =>
      createComputeInstance(vm, specTemplateOnly ? { specTemplateOnly: true } : undefined),
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

export function useComputeInstanceTemplates() {
  return useQuery({
    queryKey: queryKeys.computeInstanceTemplates,
    queryFn: () => listComputeInstanceTemplates({}),
    staleTime: 60_000,
    refetchInterval: COMPUTE_INSTANCE_TEMPLATES_REFETCH_MS,
    refetchIntervalInBackground: false,
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
    refetchInterval: COMPUTE_INSTANCES_REFETCH_MS,
    refetchIntervalInBackground: false,
    select: (data) => {
      const counts = { running: 0, paused: 0, stopped: 0, total: data.items.length }
      for (const vm of data.items) {
        const s = vm.status.state
        if (s === 'running') counts.running++
        else if (s === 'paused') counts.paused++
        else if (s === 'stopped') counts.stopped++
      }
      return counts
    },
  })
}

// Re-export template type for convenience
export type { ComputeInstance, ClusterTemplate }

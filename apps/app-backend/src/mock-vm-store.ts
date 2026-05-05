/**
 * Shared in-memory VM store for mock BFF (fulfillment routes + create-vm-wizard finalize).
 */
import { buildVmsForTenant, type ComputeInstance } from '@osac/api-contracts'

const allMockVms: ComputeInstance[] = [
  ...buildVmsForTenant('northstar'),
  ...buildVmsForTenant('evergreen'),
]

export const vmStore = new Map<string, ComputeInstance>(allMockVms.map((vm) => [vm.id, vm]))

export function listMockVms(): ComputeInstance[] {
  return Array.from(vmStore.values())
}

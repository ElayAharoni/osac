import type { DeploymentMode } from './types'

export function getStepIds(mode: DeploymentMode): string[] {
  if (mode === 'new')
    return ['deployment', 'guest-os', 'boot-source', 'compute', 'customization', 'review']
  if (mode === 'template') return ['deployment', 'template', 'customization', 'review']
  return ['deployment', 'clone-source', 'review']
}

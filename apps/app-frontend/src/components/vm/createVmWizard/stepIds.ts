import type { DeploymentMode } from './types'

export function getStepIds(mode: DeploymentMode): string[] {
  if (mode === 'new')
    return ['deployment', 'guest-os', 'boot-source', 'compute', 'customization', 'review']
  if (mode === 'template') return ['deployment', 'template', 'customization', 'review']
  return ['deployment', 'clone-source', 'review']
}

/** Aligns with BFF orderedStepIds when catalog/clone presets skip the deployment step. */
export function getWizardOrderedSteps(mode: DeploymentMode, skipDeployment: boolean): string[] {
  if (skipDeployment && mode === 'template') return ['template', 'customization', 'review']
  if (skipDeployment && mode === 'clone') return ['clone-source', 'review']
  return getStepIds(mode)
}

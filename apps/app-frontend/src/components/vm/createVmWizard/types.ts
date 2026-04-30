export interface CreateVmWizardHandle {
  open: () => void
  openFromTemplate: (templateId: string) => void
  openFromClone: (sourceVmId: string) => void
}

export type DeploymentMode = 'new' | 'template' | 'clone'

export interface WizardState {
  mode: DeploymentMode
  osFamilyNew: string
  osTypeNew: string
  bootSource: 'volume' | 'none' | null
  cpuNew: string
  memoryNew: string
  hostnameNew: string
  selectedTemplateId: string | null
  templateVmName: string
  headless: boolean
  logDeletion: boolean
  cloneSourceVmId: string | null
  cloneNewName: string
  startAfterCreate: boolean
}

export type UpdateFn = <K extends keyof WizardState>(key: K, value: WizardState[K]) => void

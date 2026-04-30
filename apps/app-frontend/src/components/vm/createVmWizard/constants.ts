import type { WizardState } from './types'

export const INITIAL_STATE: WizardState = {
  mode: 'new',
  osFamilyNew: '',
  osTypeNew: '',
  bootSource: null,
  cpuNew: '2',
  memoryNew: '4',
  hostnameNew: '',
  selectedTemplateId: null,
  templateVmName: '',
  headless: false,
  logDeletion: false,
  cloneSourceVmId: null,
  cloneNewName: '',
  startAfterCreate: true,
}

export const OS_FAMILIES = [
  { label: 'Red Hat Enterprise Linux', id: 'rhel' },
  { label: 'Linux (Ubuntu / Debian)', id: 'linux' },
  { label: 'Windows Server', id: 'windows' },
]

export const OS_TYPES: Record<string, string[]> = {
  rhel: ['RHEL 9', 'RHEL 8', 'RHEL 7'],
  linux: ['Ubuntu 22.04 LTS', 'Ubuntu 20.04 LTS', 'CentOS Stream 9'],
  windows: ['Windows Server 2022', 'Windows Server 2019'],
}

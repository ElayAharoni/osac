import type { WizardState } from './types'

export const INITIAL_STATE: WizardState = {
  mode: 'new',
  osFamilyNew: '',
  osTypeNew: '',
  bootSource: null,
  cpuNew: '2',
  memoryNew: '4',
  cloudInitUserDataNew: '',
  selectedTemplateId: null,
  templateVmName: '',
  headless: false,
  guestLogAccess: true,
  logDeletion: true,
  cloneSourceVmId: null,
  cloneNewName: '',
  startAfterCreate: true,
}

/** Merge BFF draft over defaults so omitted keys (older sessions) keep intended defaults like deletion protection on. */
export function draftFromSession(serverDraft: Partial<WizardState>): WizardState {
  return { ...INITIAL_STATE, ...serverDraft }
}

/** Guest OS step: card ids must match BFF `osFamilyNew` / `osMap` keys (`rhel`, `windows`, `linux`). */
export const GUEST_OS_FAMILIES = [
  {
    id: 'rhel',
    title: 'RHEL',
    description: 'Red Hat Enterprise Linux images for supported releases.',
  },
  {
    id: 'windows',
    title: 'Microsoft Windows',
    description: 'Windows Server and other Microsoft guest images.',
  },
  {
    id: 'linux',
    title: 'Other Linux',
    description: 'Ubuntu, Debian, CentOS Stream, and similar distributions.',
  },
] as const

export const OS_TYPES: Record<string, string[]> = {
  rhel: ['RHEL 9', 'RHEL 8', 'RHEL 7'],
  windows: ['Windows Server 2022', 'Windows Server 2019', 'Windows 11'],
  linux: ['Ubuntu 22.04 LTS', 'Ubuntu 20.04 LTS', 'Debian 12', 'CentOS Stream 9'],
}

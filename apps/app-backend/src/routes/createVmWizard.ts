/**
 * BFF create-vm-wizard session API — mock orchestration per docs/specs/backend-fulfillment.yaml
 * (bff_demo_osac_extensions.create_virtual_machine_wizard).
 * Step ids and validation: docs/specs/ui-flows/create-virtual-machine-wizard.yaml (canonical_bff_step_ids, step_worksheets).
 */
import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { VM_TEMPLATES, type ComputeInstance, type OsType } from '@osac/api-contracts'
import { vmStore } from '../mock-vm-store.js'

const prefix = '/api/osac/bff/v1/create-vm-wizard'

type DeploymentMode = 'new' | 'template' | 'clone'

type WizardDraft = {
  mode: DeploymentMode
  osFamilyNew: string
  osTypeNew: string
  bootSource: 'volume' | 'none' | null
  cpuNew: string
  memoryNew: string
  cloudInitUserDataNew: string
  selectedTemplateId: string | null
  templateVmName: string
  headless: boolean
  guestLogAccess: boolean
  logDeletion: boolean
  cloneSourceVmId: string | null
  cloneNewName: string
  startAfterCreate: boolean
}

const INITIAL_DRAFT: WizardDraft = {
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

function mergeWizardDraft(base: WizardDraft, patch?: Partial<WizardDraft>): WizardDraft {
  return { ...INITIAL_DRAFT, ...base, ...(patch ?? {}) }
}

const STEP_LABELS: Record<string, string> = {
  deployment: 'Select a creation method',
  'guest-os': 'Guest operating system',
  'boot-source': 'Boot source',
  compute: 'Compute resources',
  template: 'Templates',
  'clone-source': 'Source VM',
  customization: 'Customization',
  review: 'Review',
}

function orderedStepIds(mode: DeploymentMode, skipDeployment: boolean): string[] {
  if (skipDeployment && mode === 'template') return ['template', 'customization', 'review']
  if (skipDeployment && mode === 'clone') return ['clone-source', 'review']
  if (mode === 'new')
    return ['deployment', 'guest-os', 'boot-source', 'compute', 'customization', 'review']
  if (mode === 'template') return ['deployment', 'template', 'customization', 'review']
  return ['deployment', 'clone-source', 'review']
}

interface WizardSession {
  draft: WizardDraft
  skipDeployment: boolean
  activeIndex: number
  entry: string
}

const sessions = new Map<string, WizardSession>()

function buildStepNav(ordered: string[], activeIndex: number): { id: string; label: string; status: string }[] {
  return ordered.map((id, i) => ({
    id,
    label: STEP_LABELS[id] ?? id,
    status: i < activeIndex ? 'complete' : i === activeIndex ? 'current' : 'default',
  }))
}

function sessionPayload(session: WizardSession, sessionId: string) {
  session.draft = mergeWizardDraft(session.draft)
  const ordered = orderedStepIds(session.draft.mode, session.skipDeployment)
  const activeStepId = ordered[session.activeIndex] ?? 'review'
  return {
    sessionId,
    activeStepId,
    activeIndex: session.activeIndex,
    skipDeployment: session.skipDeployment,
    stepNav: buildStepNav(ordered, session.activeIndex),
    draft: session.draft,
  }
}

function validateStep(stepId: string, draft: WizardDraft, vms: ComputeInstance[]): Record<string, string> | null {
  const e: Record<string, string> = {}
  switch (stepId) {
    case 'deployment':
      if (!draft.mode) e.mode = 'Select a deployment method'
      break
    case 'guest-os':
      if (!draft.osFamilyNew) e.osFamilyNew = 'Select a guest OS family'
      if (!draft.osTypeNew) e.osTypeNew = 'Select a guest OS type'
      break
    case 'boot-source':
      if (!draft.bootSource) e.bootSource = 'Select a boot source'
      break
    case 'compute':
      if (!draft.cpuNew?.trim()) e.cpuNew = 'vCPU is required'
      if (!draft.memoryNew?.trim()) e.memoryNew = 'Memory is required'
      break
    case 'template':
      if (!draft.selectedTemplateId) e.selectedTemplateId = 'Select a template'
      break
    case 'clone-source': {
      if (!draft.cloneSourceVmId) e.cloneSourceVmId = 'Select a source VM'
      if (!draft.cloneNewName?.trim()) e.cloneNewName = 'Enter a name for the new VM'
      const src = vms.find((v) => v.id === draft.cloneSourceVmId)
      if (!src && draft.cloneSourceVmId) e.cloneSourceVmId = 'Source VM not found'
      if (vms.length === 0) e.cloneSourceVmId = 'No VMs available to clone'
      break
    }
    case 'customization':
      if (draft.mode === 'template' && !draft.templateVmName?.trim()) {
        e.templateVmName = 'Virtual machine name is required'
      }
      break
    case 'review':
      break
    default:
      break
  }
  return Object.keys(e).length ? e : null
}

function validateAllStepsBeforeReview(draft: WizardDraft, skipDeployment: boolean, vms: ComputeInstance[]) {
  const ordered = orderedStepIds(draft.mode, skipDeployment)
  for (const sid of ordered.slice(0, -1)) {
    const fe = validateStep(sid, draft, vms)
    if (fe) return fe
  }
  return null
}

function buildVmFromDraft(draft: WizardDraft, vms: ComputeInstance[]): ComputeInstance {
  const now = Date.now()
  const id = `vm-created-${now}`
  const osMap: Record<string, OsType> = { rhel: 'rhel', linux: 'linux', windows: 'windows' }

  if (draft.mode === 'clone') {
    const src = vms.find((v) => v.id === draft.cloneSourceVmId)
    return {
      ...(src ?? {}),
      id,
      metadata: {
        name: draft.cloneNewName.trim() || `${src?.metadata.name ?? 'vm'}-clone`,
        createdAt: new Date().toISOString(),
      },
      status: { state: 'stopped' },
      description: src ? `Cloned from ${src.metadata.name}.` : 'Cloned VM.',
      createdAtMs: now,
    } as ComputeInstance
  }

  if (draft.mode === 'template') {
    const tpl = VM_TEMPLATES.find((t) => t.id === draft.selectedTemplateId)
    return {
      id,
      metadata: {
        name: draft.templateVmName.trim() || `${tpl?.id ?? 'vm'}-instance`,
        createdAt: new Date().toISOString(),
      },
      spec: {
        template: tpl?.id,
        cores: tpl?.defaultCores ?? 2,
        memoryGib: tpl?.defaultMemoryGib ?? 8,
      },
      status: { state: draft.startAfterCreate ? 'running' : 'stopped' },
      os: osMap[tpl?.icon ?? 'linux'] ?? 'linux',
      description: tpl?.description,
      createdAtMs: now,
    } as ComputeInstance
  }

  const userData = draft.cloudInitUserDataNew?.trim()
  return {
    id,
    metadata: {
      name: `vm-${id.slice(-6)}`,
      createdAt: new Date().toISOString(),
    },
    spec: {
      cores: parseInt(draft.cpuNew, 10) || 2,
      memoryGib: parseInt(draft.memoryNew, 10) || 4,
      ...(userData ? { userData } : {}),
    },
    status: { state: draft.startAfterCreate ? 'running' : 'stopped' },
    os: osMap[draft.osFamilyNew] ?? 'linux',
    createdAtMs: now,
  } as ComputeInstance
}

export async function registerCreateVmWizardRoutes(app: FastifyInstance) {
  app.post(`${prefix}/sessions`, async (req, reply) => {
    const body = (req.body ?? {}) as {
      entry?: string
      deploymentMethod?: DeploymentMode | null
      presetTemplateId?: string | null
      presetCloneSourceVmId?: string | null
    }
    const entry = body.entry ?? 'dashboard'
    const sessionId = `wzd-${randomUUID()}`

    let draft: WizardDraft = { ...INITIAL_DRAFT }
    let skipDeployment = false
    let activeIndex = 0

    if (entry === 'catalog' && body.presetTemplateId) {
      draft = {
        ...INITIAL_DRAFT,
        mode: 'template',
        selectedTemplateId: body.presetTemplateId,
      }
      skipDeployment = true
      activeIndex = 0
    } else if (entry === 'clone_drawer' && body.presetCloneSourceVmId) {
      const src = Array.from(vmStore.values()).find((v) => v.id === body.presetCloneSourceVmId)
      draft = {
        ...INITIAL_DRAFT,
        mode: 'clone',
        cloneSourceVmId: body.presetCloneSourceVmId,
        cloneNewName: src ? `${src.metadata.name}-clone` : '',
      }
      skipDeployment = true
      activeIndex = 0
    } else if (body.deploymentMethod) {
      draft = { ...INITIAL_DRAFT, mode: body.deploymentMethod }
    }

    const session: WizardSession = { draft, skipDeployment, activeIndex, entry }
    sessions.set(sessionId, session)
    return reply.send(sessionPayload(session, sessionId))
  })

  app.get(`${prefix}/sessions/:sessionId`, async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string }
    const session = sessions.get(sessionId)
    if (!session) return reply.status(404).send({ error: 'Session not found' })
    return reply.send(sessionPayload(session, sessionId))
  })

  app.post(`${prefix}/sessions/:sessionId/advance`, async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string }
    const session = sessions.get(sessionId)
    if (!session) return reply.status(404).send({ error: 'Session not found' })

    const body = (req.body ?? {}) as { fromStepId?: string; draft?: Partial<WizardDraft> }
    const ordered = orderedStepIds(session.draft.mode, session.skipDeployment)
    const activeStepId = ordered[session.activeIndex]
    if (body.fromStepId && body.fromStepId !== activeStepId) {
      return reply.status(400).send({
        error: 'fromStepId mismatch',
        fieldErrors: { fromStepId: `Expected ${activeStepId}` },
      })
    }

    const merged = mergeWizardDraft(session.draft, body.draft)
    session.draft = merged

    const vms = Array.from(vmStore.values())
    const errs = validateStep(activeStepId, merged, vms)
    if (errs) return reply.status(400).send({ fieldErrors: errs })

    if (activeStepId === 'review') {
      return reply.status(400).send({ error: 'Use finalize on review step' })
    }

    if (session.activeIndex >= ordered.length - 1) {
      return reply.status(400).send({ error: 'Already at last step' })
    }

    session.activeIndex += 1
    return reply.send(sessionPayload(session, sessionId))
  })

  app.post(`${prefix}/sessions/:sessionId/back`, async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string }
    const session = sessions.get(sessionId)
    if (!session) return reply.status(404).send({ error: 'Session not found' })
    if (session.activeIndex <= 0) {
      return reply.status(400).send({ error: 'Cannot go back from first step' })
    }
    session.activeIndex -= 1
    return reply.send(sessionPayload(session, sessionId))
  })

  app.post(`${prefix}/sessions/:sessionId/finalize`, async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string }
    const session = sessions.get(sessionId)
    if (!session) return reply.status(404).send({ error: 'Session not found' })

    const ordered = orderedStepIds(session.draft.mode, session.skipDeployment)
    const activeStepId = ordered[session.activeIndex]
    if (activeStepId !== 'review') {
      return reply.status(400).send({ error: 'Finalize only allowed on review step' })
    }

    const body = (req.body ?? {}) as { draft?: Partial<WizardDraft> }
    session.draft = mergeWizardDraft(session.draft, body.draft)

    const vms = Array.from(vmStore.values())
    const errs = validateAllStepsBeforeReview(session.draft, session.skipDeployment, vms)
    if (errs) return reply.status(400).send({ fieldErrors: errs })

    const vm = buildVmFromDraft(session.draft, vms)
    const persisted: ComputeInstance = {
      ...vm,
      id: vm.id ?? `vm-created-${Date.now()}`,
      status: vm.status ?? { state: 'starting' },
      metadata: { ...vm.metadata, createdAt: new Date().toISOString() },
    }
    vmStore.set(persisted.id, persisted)
    sessions.delete(sessionId)
    return reply.send({ object: persisted })
  })

  app.delete(`${prefix}/sessions/:sessionId`, async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string }
    sessions.delete(sessionId)
    return reply.status(204).send()
  })
}

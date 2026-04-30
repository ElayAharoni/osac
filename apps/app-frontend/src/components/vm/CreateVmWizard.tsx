/**
 * flow: create-virtual-machine-wizard
 * steps: cvm_modal_closed → cvm_wizard_* → cvm_wizard_review_create
 *
 * Three paths:
 *  - new: from scratch (guest OS → boot source → compute → customization → review)
 *  - template: from catalog (template → customization → review)
 *  - clone: from existing VM (clone source → review)
 *
 * Uses a custom stepper Modal instead of PF6 Wizard to keep footer validation simple.
 */
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  ProgressMeasureLocation,
  ProgressSize,
} from '@patternfly/react-core'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react'
import type { ComputeInstance, DemoTenantId, OsType } from '@osac/api-contracts'
import { VM_TEMPLATES } from '@osac/api-contracts'
import { INITIAL_STATE } from './createVmWizard/constants'
import { getStepIds } from './createVmWizard/stepIds'
import {
  BootSourceStep,
  CloneSourceStep,
  ComputeStep,
  CustomizationStep,
  DeploymentStep,
  GuestOsStep,
  ReviewStep,
  TemplateStep,
} from './createVmWizard/steps/WizardSteps'
import type { CreateVmWizardHandle, DeploymentMode, WizardState } from './createVmWizard/types'
export type { CreateVmWizardHandle } from './createVmWizard/types'

interface Props {
  existingVms: ComputeInstance[]
  tenant: DemoTenantId // kept for future BFF integration
  onProvision: (vm: Partial<ComputeInstance>) => void
  defaultMode?: DeploymentMode
}

export const CreateVmWizard = forwardRef<CreateVmWizardHandle, Props>(function CreateVmWizard(
  { existingVms, tenant: _tenant, onProvision, defaultMode = 'new' },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<WizardState>({ ...INITIAL_STATE, mode: defaultMode })
  const [stepIdx, setStepIdx] = useState(0)
  const [cloneSearch, setCloneSearch] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')

  useImperativeHandle(ref, () => ({
    open() {
      setState({ ...INITIAL_STATE })
      setStepIdx(0)
      setIsOpen(true)
    },
    openFromTemplate(templateId) {
      setState({ ...INITIAL_STATE, mode: 'template', selectedTemplateId: templateId })
      setStepIdx(0)
      setIsOpen(true)
    },
    openFromClone(sourceVmId) {
      setState({ ...INITIAL_STATE, mode: 'clone', cloneSourceVmId: sourceVmId })
      setStepIdx(0)
      setIsOpen(true)
    },
  }))

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const stepIds = useMemo(() => getStepIds(state.mode), [state.mode])
  const currentStepId = stepIds[stepIdx] ?? 'review'
  const isLastStep = stepIdx === stepIds.length - 1
  const isFirstStep = stepIdx === 0

  const canProceed = useCallback((): boolean => {
    switch (currentStepId) {
      case 'guest-os':
        return !!state.osFamilyNew && !!state.osTypeNew
      case 'boot-source':
        return !!state.bootSource
      case 'compute':
        return !!state.cpuNew.trim() && !!state.memoryNew.trim()
      case 'template':
        return !!state.selectedTemplateId
      case 'clone-source':
        return !!state.cloneSourceVmId && !!state.cloneNewName.trim()
      case 'customization':
        if (state.mode === 'template') return !!state.templateVmName.trim()
        return true
      default:
        return true
    }
  }, [currentStepId, state])

  const close = useCallback(() => {
    setIsOpen(false)
    setState({ ...INITIAL_STATE, mode: defaultMode })
    setStepIdx(0)
  }, [defaultMode])

  const handleNext = useCallback(() => {
    if (!canProceed()) return
    if (isLastStep) {
      // Provision
      const now = Date.now()
      const id = `vm-created-${now}`
      const osMap: Record<string, OsType> = { rhel: 'rhel', linux: 'linux', windows: 'windows' }
      let newVm: ComputeInstance

      if (state.mode === 'clone') {
        const src = existingVms.find((v) => v.id === state.cloneSourceVmId)
        newVm = {
          ...(src ?? {}),
          id,
          metadata: {
            name: state.cloneNewName.trim() || `${src?.metadata.name ?? 'vm'}-clone`,
            createdAt: new Date().toISOString(),
          },
          status: { state: 'stopped' },
          description: src ? `Cloned from ${src.metadata.name}.` : 'Cloned VM.',
          createdAtMs: now,
        } as ComputeInstance
      } else if (state.mode === 'template') {
        const tpl = VM_TEMPLATES.find((t) => t.id === state.selectedTemplateId)
        newVm = {
          id,
          metadata: {
            name: state.templateVmName.trim() || `${tpl?.id ?? 'vm'}-instance`,
            createdAt: new Date().toISOString(),
          },
          spec: { template: tpl?.id, cores: 2, memoryGib: 8 },
          status: { state: state.startAfterCreate ? 'running' : 'stopped' },
          os: osMap[tpl?.icon ?? 'linux'] ?? 'linux',
          description: tpl?.description,
          createdAtMs: now,
        }
      } else {
        newVm = {
          id,
          metadata: {
            name: state.hostnameNew.trim() || `vm-${id.slice(-6)}`,
            createdAt: new Date().toISOString(),
          },
          spec: {
            cores: parseInt(state.cpuNew, 10) || 2,
            memoryGib: parseInt(state.memoryNew, 10) || 4,
          },
          status: { state: state.startAfterCreate ? 'running' : 'stopped' },
          os: osMap[state.osFamilyNew] ?? 'linux',
          createdAtMs: now,
        }
      }

      onProvision(newVm)
      close()
    } else {
      // If mode changes on deployment step, reset stepIdx to 0 to recalculate steps
      if (currentStepId === 'deployment') {
        setStepIdx(1)
      } else {
        setStepIdx((i) => Math.min(i + 1, stepIds.length - 1))
      }
    }
  }, [
    canProceed,
    isLastStep,
    state,
    existingVms,
    onProvision,
    close,
    currentStepId,
    stepIds.length,
  ])

  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return VM_TEMPLATES
    const q = templateSearch.toLowerCase()
    return VM_TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [templateSearch])

  const filteredCloneVms = useMemo(() => {
    if (!cloneSearch) return existingVms
    const q = cloneSearch.toLowerCase()
    return existingVms.filter((vm) => vm.metadata.name.toLowerCase().includes(q))
  }, [cloneSearch, existingVms])

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      variant="large"
      aria-label="Create virtual machine wizard"
    >
      <ModalHeader title="Create virtual machine" />
      <ModalBody style={{ minHeight: 420 }}>
        {/* Step indicator */}
        <Progress
          title="Wizard progress"
          value={((stepIdx + 1) / stepIds.length) * 100}
          measureLocation={ProgressMeasureLocation.none}
          size={ProgressSize.sm}
          style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}
        />

        {/* Step content */}
        {currentStepId === 'deployment' && <DeploymentStep state={state} update={update} />}
        {currentStepId === 'guest-os' && <GuestOsStep state={state} update={update} />}
        {currentStepId === 'boot-source' && <BootSourceStep state={state} update={update} />}
        {currentStepId === 'compute' && <ComputeStep state={state} update={update} />}
        {currentStepId === 'template' && (
          <TemplateStep
            state={state}
            update={update}
            search={templateSearch}
            setSearch={setTemplateSearch}
            templates={filteredTemplates}
          />
        )}
        {currentStepId === 'clone-source' && (
          <CloneSourceStep
            state={state}
            update={update}
            search={cloneSearch}
            setSearch={setCloneSearch}
            vms={filteredCloneVms}
          />
        )}
        {currentStepId === 'customization' && <CustomizationStep state={state} update={update} />}
        {currentStepId === 'review' && <ReviewStep state={state} update={update} />}
      </ModalBody>

      <ModalFooter>
        <Button variant="primary" isDisabled={!canProceed()} onClick={handleNext}>
          {isLastStep ? 'Create virtual machine' : 'Next'}
        </Button>
        {!isFirstStep && (
          <Button variant="secondary" onClick={() => setStepIdx((i) => Math.max(0, i - 1))}>
            Back
          </Button>
        )}
        <Button variant="link" onClick={close}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
})

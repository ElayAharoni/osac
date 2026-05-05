/**
 * flow: create-virtual-machine-wizard
 * steps: cvm_modal_closed → cvm_modal_open → cvm_wizard_* → cvm_wizard_review_create
 *
 * Three provision paths (always-visible WizardStep list; path steps use isHidden):
 *   deployment-details (1)
 *   guest-os      (2)  — new only
 *   boot-source   (3)  — new only
 *   compute       (4)  — new only
 *   template      (5)  — template only
 *   clone-source  (6)  — clone only
 *   customization (7)  — new + template
 *   review        (8)  — always
 *
 * Using isHidden keeps step indices stable so startIndex works correctly for
 * openFromTemplate (5) and openFromClone (6) without wizard key resets on mode change.
 */
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react'
import {
  Modal,
  Wizard,
  WizardFooter,
  WizardHeader,
  WizardStep,
} from '@patternfly/react-core'
import type { ComputeInstance, DemoTenantId, OsType } from '@osac/api-contracts'
import { VM_TEMPLATES } from '@osac/api-contracts'
import { INITIAL_STATE } from './createVmWizard/constants'
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

// Step indices (1-based, matching WizardStep order below).
// Exported as named constants so they are easy to grep and update if steps are reordered.
const STEP_INDEX_DEPLOYMENT   = 1
const STEP_INDEX_TEMPLATE     = 5
const STEP_INDEX_CLONE_SOURCE = 6

interface Props {
  existingVms: ComputeInstance[]
  tenant: DemoTenantId
  onProvision: (vm: Partial<ComputeInstance>) => void
  defaultMode?: DeploymentMode
}

export const CreateVmWizard = forwardRef<CreateVmWizardHandle, Props>(function CreateVmWizard(
  { existingVms, tenant: _tenant, onProvision, defaultMode = 'new' },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<WizardState>({ ...INITIAL_STATE, mode: defaultMode })
  const [wizardKey, setWizardKey] = useState(0)
  const [startStepIndex, setStartStepIndex] = useState(STEP_INDEX_DEPLOYMENT)
  const [cloneSearch, setCloneSearch] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')

  useImperativeHandle(ref, () => ({
    open() {
      setState({ ...INITIAL_STATE })
      setWizardKey((k) => k + 1)
      setStartStepIndex(STEP_INDEX_DEPLOYMENT)
      setIsOpen(true)
    },
    openFromTemplate(templateId) {
      setState({ ...INITIAL_STATE, mode: 'template', selectedTemplateId: templateId })
      setWizardKey((k) => k + 1)
      setStartStepIndex(STEP_INDEX_TEMPLATE)
      setIsOpen(true)
    },
    openFromClone(sourceVmId) {
      setState({ ...INITIAL_STATE, mode: 'clone', cloneSourceVmId: sourceVmId })
      setWizardKey((k) => k + 1)
      setStartStepIndex(STEP_INDEX_CLONE_SOURCE)
      setIsOpen(true)
    },
  }))

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const canProceedForStep = useCallback(
    (stepId: string | undefined): boolean => {
      switch (stepId) {
        case 'guest-os':
          return !!state.osFamilyNew && !!state.osTypeNew
        case 'boot-source':
          return !!state.bootSource
        case 'compute':
          return !!state.cpuNew.trim() && !!state.memoryNew.trim()
        case 'template':
          return !!state.selectedTemplateId
        case 'clone-source':
          return (
            !!state.cloneSourceVmId &&
            !!state.cloneNewName.trim() &&
            existingVms.length > 0
          )
        case 'customization':
          if (state.mode === 'template') return !!state.templateVmName.trim()
          return true
        default:
          return true
      }
    },
    [state, existingVms],
  )

  const close = useCallback(() => {
    setIsOpen(false)
    setState({ ...INITIAL_STATE, mode: defaultMode })
    setWizardKey((k) => k + 1)
    setStartStepIndex(STEP_INDEX_DEPLOYMENT)
  }, [defaultMode])

  const handleProvision = useCallback(() => {
    const now = Date.now()
    const id = `vm-created-${now}`
    const osMap: Record<string, OsType> = {
      rhel: 'rhel',
      linux: 'linux',
      'other-linux': 'linux',
      windows: 'windows',
    }
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
  }, [state, existingVms, onProvision, close])

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

  const isNew      = state.mode === 'new'
  const isTpl      = state.mode === 'template'
  const isClone    = state.mode === 'clone'

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      variant="large"
      aria-label="Create virtual machine wizard"
    >
      <Wizard
        key={wizardKey}
        startIndex={startStepIndex}
        height={560}
        onClose={close}
        onSave={handleProvision}
        header={
          <WizardHeader
            title="Create virtual machine"
            titleId="create-vm-wizard-title"
            description="Configure guest OS, boot source, and resources, then review and create."
            descriptionId="create-vm-wizard-desc"
            onClose={close}
            closeButtonAriaLabel="Close wizard"
          />
        }
        footer={(activeStep, onNext, onBack, onCloseFooter) => (
          <WizardFooter
            activeStep={activeStep}
            onNext={onNext}
            onBack={onBack}
            onClose={onCloseFooter}
            nextButtonText={activeStep?.id === 'review' ? 'Create virtual machine' : 'Next'}
            isBackDisabled={activeStep?.id === 'deployment-details'}
            isNextDisabled={!canProceedForStep(activeStep?.id as string)}
          />
        )}
      >
        {/* Step 1 — always shown */}
        <WizardStep id="deployment-details" name="Select a creation method">
          <DeploymentStep state={state} update={update} />
        </WizardStep>

        {/* Steps 2-4 — new path only */}
        <WizardStep id="guest-os" name="Guest operating system" isHidden={!isNew}>
          <GuestOsStep state={state} update={update} />
        </WizardStep>
        <WizardStep id="boot-source" name="Boot source" isHidden={!isNew}>
          <BootSourceStep state={state} update={update} />
        </WizardStep>
        <WizardStep id="compute" name="Compute resources" isHidden={!isNew}>
          <ComputeStep state={state} update={update} />
        </WizardStep>

        {/* Step 5 — template path only */}
        <WizardStep id="template" name="Templates" isHidden={!isTpl}>
          <TemplateStep
            state={state}
            update={update}
            search={templateSearch}
            setSearch={setTemplateSearch}
            templates={filteredTemplates}
          />
        </WizardStep>

        {/* Step 6 — clone path only */}
        <WizardStep id="clone-source" name="Source VM" isHidden={!isClone}>
          <CloneSourceStep
            state={state}
            update={update}
            search={cloneSearch}
            setSearch={setCloneSearch}
            vms={filteredCloneVms}
          />
        </WizardStep>

        {/* Step 7 — new + template only */}
        <WizardStep id="customization" name="Customization" isHidden={isClone}>
          <CustomizationStep state={state} update={update} />
        </WizardStep>

        {/* Step 8 — always shown */}
        <WizardStep id="review" name="Review and create">
          <ReviewStep state={state} update={update} />
        </WizardStep>
      </Wizard>
    </Modal>
  )
})

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
  Checkbox,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  SearchInput,
  TextInput,
} from '@patternfly/react-core'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react'
import type { ComputeInstance, DemoTenantId, OsType } from '@osac/api-contracts'
import { VM_TEMPLATES } from '@osac/api-contracts'
import { VmStatusLabel } from '@osac/ui-components'

// ---------------------------------------------------------------------------
// Public handle
// ---------------------------------------------------------------------------

export interface CreateVmWizardHandle {
  open: () => void
  openFromTemplate: (templateId: string) => void
  openFromClone: (sourceVmId: string) => void
}

type DeploymentMode = 'new' | 'template' | 'clone'

interface WizardState {
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

const INITIAL_STATE: WizardState = {
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

const OS_FAMILIES = [
  { label: 'Red Hat Enterprise Linux', id: 'rhel' },
  { label: 'Linux (Ubuntu / Debian)', id: 'linux' },
  { label: 'Windows Server', id: 'windows' },
]

const OS_TYPES: Record<string, string[]> = {
  rhel: ['RHEL 9', 'RHEL 8', 'RHEL 7'],
  linux: ['Ubuntu 22.04 LTS', 'Ubuntu 20.04 LTS', 'CentOS Stream 9'],
  windows: ['Windows Server 2022', 'Windows Server 2019'],
}

// Step ids per mode
function getStepIds(mode: DeploymentMode): string[] {
  if (mode === 'new')
    return ['deployment', 'guest-os', 'boot-source', 'compute', 'customization', 'review']
  if (mode === 'template')
    return ['deployment', 'template', 'customization', 'review']
  return ['deployment', 'clone-source', 'review']
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
      case 'guest-os': return !!state.osFamilyNew && !!state.osTypeNew
      case 'boot-source': return !!state.bootSource
      case 'compute': return !!state.cpuNew.trim() && !!state.memoryNew.trim()
      case 'template': return !!state.selectedTemplateId
      case 'clone-source': return !!state.cloneSourceVmId && !!state.cloneNewName.trim()
      case 'customization':
        if (state.mode === 'template') return !!state.templateVmName.trim()
        return true
      default: return true
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
  }, [canProceed, isLastStep, state, existingVms, onProvision, close, currentStepId, stepIds.length])

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
        <div
          style={{
            display: 'flex',
            gap: 'var(--pf-t--global--spacer--xs)',
            marginBottom: 'var(--pf-t--global--spacer--lg)',
          }}
        >
          {stepIds.map((id, i) => (
            <div
              key={id}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  i < stepIdx
                    ? 'var(--pf-t--global--color--status--success--default)'
                    : i === stepIdx
                      ? 'var(--pf-t--global--color--brand--default)'
                      : 'var(--pf-t--global--border--color--default)',
              }}
            />
          ))}
        </div>

        {/* Step content */}
        {currentStepId === 'deployment' && (
          <DeploymentStep state={state} update={update} />
        )}
        {currentStepId === 'guest-os' && (
          <GuestOsStep state={state} update={update} />
        )}
        {currentStepId === 'boot-source' && (
          <BootSourceStep state={state} update={update} />
        )}
        {currentStepId === 'compute' && (
          <ComputeStep state={state} update={update} />
        )}
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
        {currentStepId === 'customization' && (
          <CustomizationStep state={state} update={update} />
        )}
        {currentStepId === 'review' && (
          <ReviewStep state={state} update={update} />
        )}
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

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

type UpdateFn = <K extends keyof WizardState>(key: K, value: WizardState[K]) => void

function DeploymentStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      <FormGroup label="How do you want to create this VM?" fieldId="deploy-method">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pf-t--global--spacer--md)' }}>
          {([
            { value: 'new', label: 'New virtual machine (from scratch)', desc: 'Configure OS, compute, and storage manually.' },
            { value: 'template', label: 'From template', desc: 'Start from a predefined configuration.' },
            { value: 'clone', label: 'Clone existing VM', desc: 'Duplicate an existing virtual machine.' },
          ] as { value: DeploymentMode; label: string; desc: string }[]).map((m) => (
            <Radio
              key={m.value}
              id={`deploy-${m.value}`}
              name="deployMethod"
              label={m.label}
              description={m.desc}
              isChecked={state.mode === m.value}
              onChange={() => update('mode', m.value)}
            />
          ))}
        </div>
      </FormGroup>
    </Form>
  )
}

function GuestOsStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      <FormGroup label="OS family" fieldId="os-family" isRequired>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pf-t--global--spacer--sm)' }}>
          {OS_FAMILIES.map((f) => (
            <Radio
              key={f.id}
              id={`os-fam-${f.id}`}
              name="osFamily"
              label={f.label}
              isChecked={state.osFamilyNew === f.id}
              onChange={() => { update('osFamilyNew', f.id); update('osTypeNew', '') }}
            />
          ))}
        </div>
      </FormGroup>
      {state.osFamilyNew && (
        <FormGroup label="OS version" fieldId="os-type" isRequired>
          <FormSelect
            id="os-type"
            value={state.osTypeNew}
            onChange={(_e, v) => update('osTypeNew', v)}
          >
            <FormSelectOption value="" label="Select a version…" isPlaceholder />
            {(OS_TYPES[state.osFamilyNew] ?? []).map((t) => (
              <FormSelectOption key={t} value={t} label={t} />
            ))}
          </FormSelect>
        </FormGroup>
      )}
    </Form>
  )
}

function BootSourceStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      <FormGroup label="Boot source" fieldId="boot-source" isRequired>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pf-t--global--spacer--sm)' }}>
          <Radio
            id="boot-volume"
            name="bootSource"
            label="Boot from volume"
            description="Attach a persistent boot disk."
            isChecked={state.bootSource === 'volume'}
            onChange={() => update('bootSource', 'volume')}
          />
          <Radio
            id="boot-none"
            name="bootSource"
            label="No boot source"
            description="VM boots from PXE or network; no persistent disk attached."
            isChecked={state.bootSource === 'none'}
            onChange={() => update('bootSource', 'none')}
          />
        </div>
      </FormGroup>
    </Form>
  )
}

function ComputeStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      <FormGroup label="vCPU count" fieldId="cpu" isRequired>
        <TextInput
          id="cpu"
          type="number"
          value={state.cpuNew}
          onChange={(_e, v) => update('cpuNew', v)}
          min={1}
        />
      </FormGroup>
      <FormGroup label="Memory (GiB)" fieldId="memory" isRequired>
        <TextInput
          id="memory"
          type="number"
          value={state.memoryNew}
          onChange={(_e, v) => update('memoryNew', v)}
          min={1}
        />
      </FormGroup>
    </Form>
  )
}

function TemplateStep({
  state,
  update,
  search,
  setSearch,
  templates,
}: {
  state: WizardState
  update: UpdateFn
  search: string
  setSearch: (s: string) => void
  templates: typeof VM_TEMPLATES
}) {
  return (
    <div>
      <SearchInput
        placeholder="Search templates…"
        value={search}
        onChange={(_e, v) => setSearch(v)}
        onClear={() => setSearch('')}
        style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--pf-t--global--spacer--sm)', maxHeight: 320, overflowY: 'auto' }}>
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => update('selectedTemplateId', tpl.id)}
            style={{
              border: `2px solid ${state.selectedTemplateId === tpl.id ? 'var(--pf-t--global--color--brand--default)' : 'var(--pf-t--global--border--color--default)'}`,
              borderRadius: 'var(--pf-t--global--border--radius--medium)',
              padding: 'var(--pf-t--global--spacer--md)',
              background: state.selectedTemplateId === tpl.id
                ? 'var(--pf-t--global--color--brand--subtle)'
                : 'var(--pf-t--global--background--color--primary--default)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Content component="p" style={{ fontWeight: 600, margin: 0 }}>{tpl.title}</Content>
            {tpl.description && (
              <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                {tpl.description.slice(0, 60)}…
              </Content>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {(tpl.tags ?? []).slice(0, 2).map((tag) => (
                <Label key={tag} isCompact color="blue" variant="outline">{tag}</Label>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function CloneSourceStep({
  state,
  update,
  search,
  setSearch,
  vms,
}: {
  state: WizardState
  update: UpdateFn
  search: string
  setSearch: (s: string) => void
  vms: ComputeInstance[]
}) {
  return (
    <Form>
      <FormGroup label="Search VMs" fieldId="clone-search">
        <SearchInput
          id="clone-search"
          placeholder="Filter by name…"
          value={search}
          onChange={(_e, v) => setSearch(v)}
          onClear={() => setSearch('')}
        />
      </FormGroup>
      <FormGroup label="Source VM" fieldId="clone-source-list">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
          {vms.map((vm) => (
            <button
              key={vm.id}
              type="button"
              onClick={() => {
                update('cloneSourceVmId', vm.id)
                update('cloneNewName', `${vm.metadata.name}-clone`)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--pf-t--global--spacer--sm)',
                border: `1px solid ${state.cloneSourceVmId === vm.id ? 'var(--pf-t--global--color--brand--default)' : 'var(--pf-t--global--border--color--default)'}`,
                borderRadius: 'var(--pf-t--global--border--radius--small)',
                padding: 'var(--pf-t--global--spacer--sm)',
                background: state.cloneSourceVmId === vm.id
                  ? 'var(--pf-t--global--color--brand--subtle)'
                  : 'var(--pf-t--global--background--color--primary--default)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <VmStatusLabel state={vm.status.state} />
              <span style={{ fontWeight: 600 }}>{vm.metadata.name}</span>
            </button>
          ))}
          {vms.length === 0 && (
            <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
              No VMs match your search.
            </Content>
          )}
        </div>
      </FormGroup>
      <FormGroup label="New VM name" fieldId="clone-new-name" isRequired>
        <TextInput
          id="clone-new-name"
          value={state.cloneNewName}
          onChange={(_e, v) => update('cloneNewName', v)}
          placeholder="Enter a name for the cloned VM"
        />
      </FormGroup>
    </Form>
  )
}

function CustomizationStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      {state.mode === 'template' && (
        <FormGroup label="Virtual machine name" fieldId="template-vm-name" isRequired>
          <TextInput
            id="template-vm-name"
            value={state.templateVmName}
            onChange={(_e, v) => update('templateVmName', v)}
            placeholder="Enter a name for this virtual machine"
          />
        </FormGroup>
      )}
      {state.mode === 'new' && (
        <FormGroup label="Hostname (optional)" fieldId="hostname">
          <TextInput
            id="hostname"
            value={state.hostnameNew}
            onChange={(_e, v) => update('hostnameNew', v)}
            placeholder="Leave blank to auto-generate"
          />
        </FormGroup>
      )}
      {state.mode === 'template' && (
        <>
          <Checkbox
            id="headless"
            label="Run headless (no display)"
            isChecked={state.headless}
            onChange={(_e, v) => update('headless', v)}
          />
          <Checkbox
            id="log-deletion"
            label="Enable log deletion protection"
            isChecked={state.logDeletion}
            onChange={(_e, v) => update('logDeletion', v)}
          />
        </>
      )}
    </Form>
  )
}

function ReviewStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  const tpl = state.selectedTemplateId
    ? VM_TEMPLATES.find((t) => t.id === state.selectedTemplateId)
    : null

  return (
    <div>
      <DescriptionList isCompact style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}>
        <DescriptionListGroup>
          <DescriptionListTerm>Deployment method</DescriptionListTerm>
          <DescriptionListDescription>
            {state.mode === 'new' ? 'New from scratch' : state.mode === 'template' ? 'From template' : 'Clone'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        {tpl && (
          <DescriptionListGroup>
            <DescriptionListTerm>Template</DescriptionListTerm>
            <DescriptionListDescription>{tpl.title}</DescriptionListDescription>
          </DescriptionListGroup>
        )}
        {state.mode === 'new' && (
          <>
            <DescriptionListGroup>
              <DescriptionListTerm>Operating system</DescriptionListTerm>
              <DescriptionListDescription>{state.osTypeNew || state.osFamilyNew || '—'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>vCPU</DescriptionListTerm>
              <DescriptionListDescription>{state.cpuNew || '—'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Memory</DescriptionListTerm>
              <DescriptionListDescription>{state.memoryNew ? `${state.memoryNew} GiB` : '—'}</DescriptionListDescription>
            </DescriptionListGroup>
          </>
        )}
        {state.mode === 'template' && state.templateVmName && (
          <DescriptionListGroup>
            <DescriptionListTerm>VM name</DescriptionListTerm>
            <DescriptionListDescription>{state.templateVmName}</DescriptionListDescription>
          </DescriptionListGroup>
        )}
        {state.mode === 'clone' && (
          <DescriptionListGroup>
            <DescriptionListTerm>New VM name</DescriptionListTerm>
            <DescriptionListDescription>{state.cloneNewName || '—'}</DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
      <Checkbox
        id="start-after"
        label="Start virtual machine after creation"
        isChecked={state.startAfterCreate}
        onChange={(_e, v) => update('startAfterCreate', v)}
      />
    </div>
  )
}

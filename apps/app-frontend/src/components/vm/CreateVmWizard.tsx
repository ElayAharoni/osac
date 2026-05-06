/**
 * flow: create-virtual-machine-wizard
 * steps: cvm_modal_open, cvm_wizard_*, cvm_wizard_review_create
 *
 * PatternFly Wizard (WizardNav) inside Modal; step transitions via BFF session API.
 * Per-step operate / validate contract: docs/specs/ui-flows/create-virtual-machine-wizard.yaml (step_worksheets).
 */
import {
  Alert,
  Bullseye,
  Button,
  Flex,
  Modal,
  Spinner,
  Wizard,
  WizardFooterWrapper,
  WizardHeader,
  WizardStep,
} from '@patternfly/react-core'
import type { ComputeInstance, DemoTenantId } from '@osac/api-contracts'
import {
  advanceWizardSession,
  abandonWizardSession,
  backWizardSession,
  CreateVmWizardApiError,
  finalizeWizardSession,
  startWizardSession,
  type WizardSessionResponse,
} from '../../api/createVmWizardClient'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react'
import { draftFromSession, INITIAL_STATE } from './createVmWizard/constants'
import { getWizardOrderedSteps } from './createVmWizard/stepIds'
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

interface Props {
  existingVms: ComputeInstance[]
  tenant: DemoTenantId
  onProvision: (vm: ComputeInstance) => void
  defaultMode?: DeploymentMode
}

function canProceedLocal(stepId: string, state: WizardState): boolean {
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
      return !!state.cloneSourceVmId && !!state.cloneNewName.trim()
    case 'customization':
      if (state.mode === 'template') return !!state.templateVmName.trim()
      return true
    default:
      return true
  }
}

export const CreateVmWizard = forwardRef<CreateVmWizardHandle, Props>(function CreateVmWizard(
  { existingVms, tenant: _tenant, onProvision, defaultMode = 'new' },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<WizardSessionResponse | null>(null)
  const [draft, setDraft] = useState<WizardState>(() =>
    draftFromSession({ ...INITIAL_STATE, mode: defaultMode }),
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [cloneSearch, setCloneSearch] = useState('')

  const resetLocal = useCallback(() => {
    setSession(null)
    setDraft(draftFromSession({ ...INITIAL_STATE, mode: defaultMode }))
    setFieldErrors({})
    setCloneSearch('')
  }, [defaultMode])

  const runStart = useCallback(async (body: Parameters<typeof startWizardSession>[0]) => {
    setLoading(true)
    setFieldErrors({})
    try {
      const s = await startWizardSession(body)
      setSession(s)
      setDraft(draftFromSession(s.draft as Partial<WizardState>))
    } catch (err) {
      const msg =
        err instanceof CreateVmWizardApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err)
      setFieldErrors({ _api: msg })
    } finally {
      setLoading(false)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    open() {
      resetLocal()
      setIsOpen(true)
      void runStart({ entry: 'dashboard' })
    },
    openFromTemplate(templateId) {
      resetLocal()
      setIsOpen(true)
      void runStart({ entry: 'catalog', presetTemplateId: templateId })
    },
    openFromClone(sourceVmId) {
      resetLocal()
      setIsOpen(true)
      void runStart({ entry: 'clone_drawer', presetCloneSourceVmId: sourceVmId })
    },
  }))

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const close = useCallback(async () => {
    if (session?.sessionId) {
      try {
        await abandonWizardSession(session.sessionId)
      } catch {
        /* ignore */
      }
    }
    setIsOpen(false)
    resetLocal()
  }, [session?.sessionId, resetLocal])

  const orderedSteps = useMemo(() => {
    if (!session) return [] as string[]
    return getWizardOrderedSteps(draft.mode, session.skipDeployment)
  }, [session, draft.mode])

  const isFirst = session ? session.activeIndex <= 0 : true
  const isReview = session?.activeStepId === 'review'
  const canNext = session ? canProceedLocal(session.activeStepId, draft) : false

  const handleBack = useCallback(async () => {
    if (!session?.sessionId || isFirst) return
    setPending(true)
    setFieldErrors({})
    try {
      const s = await backWizardSession(session.sessionId)
      setSession(s)
      setDraft(draftFromSession(s.draft as Partial<WizardState>))
    } catch (err) {
      const msg =
        err instanceof CreateVmWizardApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err)
      setFieldErrors({ _api: msg })
    } finally {
      setPending(false)
    }
  }, [session, isFirst])

  const handleNextOrCreate = useCallback(async () => {
    if (!session?.sessionId) return
    setPending(true)
    setFieldErrors({})
    try {
      if (isReview) {
        const { object } = await finalizeWizardSession(session.sessionId, draft)
        onProvision(object)
        setIsOpen(false)
        resetLocal()
        return
      }
      const s = await advanceWizardSession(session.sessionId, session.activeStepId, draft)
      setSession(s)
      setDraft(draftFromSession(s.draft as Partial<WizardState>))
    } catch (err) {
      if (err instanceof CreateVmWizardApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors)
      } else {
        const msg =
          err instanceof CreateVmWizardApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : String(err)
        setFieldErrors({ _api: msg })
      }
    } finally {
      setPending(false)
    }
  }, [session, isReview, draft, onProvision, resetLocal])

  const renderStepBody = (stepId: string) => {
    switch (stepId) {
      case 'deployment':
        return <DeploymentStep state={draft} update={update} />
      case 'guest-os':
        return <GuestOsStep state={draft} update={update} />
      case 'boot-source':
        return <BootSourceStep state={draft} update={update} />
      case 'compute':
        return <ComputeStep state={draft} update={update} />
      case 'template':
        return <TemplateStep state={draft} update={update} />
      case 'clone-source':
        return (
          <CloneSourceStep
            state={draft}
            update={update}
            search={cloneSearch}
            setSearch={setCloneSearch}
            vms={existingVms}
          />
        )
      case 'customization':
        return <CustomizationStep state={draft} update={update} />
      case 'review':
        return <ReviewStep state={draft} update={update} vms={existingVms} />
      default:
        return null
    }
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  const renderApiAlert = (stepId: string) =>
    hasFieldErrors && session && session.activeStepId === stepId ? (
      <Alert
        variant="danger"
        isInline
        title="Could not continue"
        style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
      >
        {fieldErrors._api ??
          Object.entries(fieldErrors)
            .filter(([k]) => k !== '_api')
            .map(([k, v]) => (
              <div key={k}>
                <strong>{k}</strong>: {v}
              </div>
            ))}
      </Alert>
    ) : null

  /** WizardHeader already renders a close control; Modal `onClose` would add a second box close button. */
  const hideModalBoxClose = Boolean(session && !loading)
  const isDeploymentStep = session?.activeStepId === 'deployment'

  return (
    <Modal
      isOpen={isOpen}
      onClose={hideModalBoxClose ? undefined : close}
      onEscapePress={
        hideModalBoxClose
          ? () => {
              void close()
            }
          : undefined
      }
      variant="large"
      width="min(980px, 86vw)"
      maxWidth="88vw"
      aria-label="Create virtual machine wizard"
      ouiaId="create-vm-wizard-modal"
    >
      {loading ? (
        <Bullseye style={{ minHeight: 320 }}>
          <Spinner aria-label="Loading wizard" />
        </Bullseye>
      ) : !session ? (
        <Bullseye style={{ minHeight: 320 }}>
          {hasFieldErrors ? (
            <>
              <Alert variant="danger" title="Wizard could not start" style={{ maxWidth: 480 }}>
                {fieldErrors._api ?? 'An error occurred.'}
              </Alert>
              <Button
                variant="primary"
                onClick={() => void close()}
                style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}
              >
                Close
              </Button>
            </>
          ) : (
            <Spinner aria-label="Loading wizard" />
          )}
        </Bullseye>
      ) : (
        <Wizard
          key={`${session.sessionId}-${session.activeIndex}`}
          className={['create-vm-wizard', isDeploymentStep ? 'create-vm-wizard--deployment-step' : '']
            .filter(Boolean)
            .join(' ')}
          navAriaLabel="Create virtual machine steps"
          startIndex={session.activeIndex + 1}
          height="min(680px, calc(100vh - 120px))"
          header={
            <WizardHeader
              title="Create virtual machine"
              description="Complete the steps to provision a virtual machine."
              onClose={close}
              closeButtonAriaLabel="Close wizard"
            />
          }
          footer={
            <WizardFooterWrapper>
              <Flex
                style={{ width: '100%' }}
                justifyContent={{ default: 'justifyContentFlexStart' }}
                alignItems={{ default: 'alignItemsCenter' }}
                flexWrap={{ default: 'wrap' }}
                gap={{ default: 'gapMd' }}
              >
                <Button
                  variant="secondary"
                  onClick={handleBack}
                  isDisabled={isFirst || pending}
                  isAriaDisabled={isFirst || pending}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handleNextOrCreate()}
                  isDisabled={!canNext || pending}
                  isAriaDisabled={!canNext || pending}
                  isLoading={pending}
                >
                  {isReview ? 'Create virtual machine' : 'Next'}
                </Button>
                <Button variant="link" onClick={() => void close()} isDisabled={pending}>
                  Cancel
                </Button>
              </Flex>
            </WizardFooterWrapper>
          }
          onClose={close}
        >
          {orderedSteps.map((stepId) => (
            <WizardStep key={stepId} id={stepId} name={STEP_LABELS[stepId] ?? stepId}>
              {renderApiAlert(stepId)}
              {renderStepBody(stepId)}
            </WizardStep>
          ))}
        </Wizard>
      )}
    </Modal>
  )
})

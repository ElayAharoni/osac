/**
 * flow: create-virtual-machine-wizard
 * step: cvm_wizard_deployment_details
 *
 * Three selectable icon-tile cards in a 3-column grid.
 * Pattern mirrors the Guest OS family tiles and the osac-demo deployment step.
 */
import {
  Card,
  CardHeader,
  CardTitle,
  Content,
  Gallery,
  GalleryItem,
  Label,
  Title,
} from '@patternfly/react-core'
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons/catalog-icon'
import { CloneIcon } from '@patternfly/react-icons/dist/esm/icons/clone-icon'
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon'
import type { DeploymentMode, UpdateFn, WizardState } from '../types'

// ---------------------------------------------------------------------------
// Deployment option data — matches terminology / spec
// ---------------------------------------------------------------------------

const ICON_BADGE_BG = 'var(--pf-t--global--background--color--secondary--default)'

interface DeploymentOption {
  method: DeploymentMode
  cardId: string
  inputId: string
  title: string
  description: string
  ariaLabel: string
  recommended?: true
  iconColor: string
}

const DEPLOYMENT_OPTIONS: DeploymentOption[] = [
  {
    method: 'new',
    cardId: 'create-vm-deploy-new-card',
    inputId: 'create-vm-deploy-new',
    title: 'Create new virtual machine',
    description: 'Define a new instance from scratch, then configure OS, storage, and networking.',
    ariaLabel: 'Select create new virtual machine',
    iconColor: 'var(--pf-t--global--palette--blue--400)',
  },
  {
    method: 'template',
    cardId: 'create-vm-deploy-template-card',
    inputId: 'create-vm-deploy-template',
    title: 'Create from template',
    description: 'Provision from a catalog template with recommended CPU, memory, and disk.',
    ariaLabel: 'Select create from template, recommended',
    recommended: true,
    iconColor: 'var(--pf-t--global--palette--purple--400)',
  },
  {
    method: 'clone',
    cardId: 'create-vm-deploy-clone-card',
    inputId: 'create-vm-deploy-clone',
    title: 'Clone existing virtual machine',
    description: "Duplicate an existing virtual machine's configuration as a starting point.",
    ariaLabel: 'Select clone existing virtual machine',
    iconColor: 'var(--pf-t--global--palette--cyan--400)',
  },
]

const ICON_PX = 26

function DeploymentIcon({ method, color }: { method: DeploymentMode; color: string }) {
  const style = { width: ICON_PX, height: ICON_PX, flexShrink: 0 as const, color }
  if (method === 'new')      return <PlusCircleIcon aria-hidden style={style} />
  if (method === 'template') return <CatalogIcon    aria-hidden style={style} />
  return                              <CloneIcon     aria-hidden style={style} />
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DeploymentStepProps {
  state: WizardState
  update: UpdateFn
  /** Called when the user picks a new mode; triggers a wizard reset in the parent. */
  onModeChange?: (mode: DeploymentMode) => void
}

export function DeploymentStep({ state, update, onModeChange }: DeploymentStepProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--pf-t--global--spacer--lg)',
      }}
    >
      <div>
        <Title headingLevel="h3">Select a creation method</Title>
        <Content
          component="p"
          style={{
            marginTop: 'var(--pf-t--global--spacer--xs)',
            marginBottom: 0,
            color: 'var(--pf-t--global--text--color--subtle)',
          }}
        >
          Choose your preferred path to begin. We recommend creating from a template.
        </Content>
      </div>

      <Gallery hasGutter minWidths={{ default: '220px' }}>
        {DEPLOYMENT_OPTIONS.map((opt) => (
          <GalleryItem key={opt.method}>
            <Card
              id={opt.cardId}
              isFullHeight
              isSelectable
              isSelected={state.mode === opt.method}
            >
              <CardHeader
                selectableActions={{
                  variant: 'single',
                  name: 'deployment-method',
                  selectableActionId: opt.inputId,
                  selectableActionAriaLabel: opt.ariaLabel,
                  onChange: (_e, checked) => {
                    if (checked) {
                      update('mode', opt.method)
                      onModeChange?.(opt.method)
                    }
                  },
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 'var(--pf-t--global--spacer--md)',
                    width: '100%',
                    minWidth: 0,
                  }}
                >
                  {/* pf-primitive-exception: 44×44 icon badge requires a fixed-size flex container */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--pf-t--global--border--radius--medium)',
                      backgroundColor: ICON_BADGE_BG,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DeploymentIcon method={opt.method} color={opt.iconColor} />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 'var(--pf-t--global--spacer--sm)',
                      width: '100%',
                      minWidth: 0,
                    }}
                  >
                    <CardTitle
                      style={{
                        fontSize: 'var(--pf-t--global--font--size--body--lg)',
                        margin: 0,
                        flex: '1 1 auto',
                        minWidth: 0,
                      }}
                    >
                      {opt.title}
                    </CardTitle>
                    {opt.recommended && (
                      <Label color="blue" isCompact>
                        Recommended
                      </Label>
                    )}
                  </div>

                  <Content
                    component="p"
                    style={{
                      margin: 0,
                      color: 'var(--pf-t--global--text--color--subtle)',
                      fontSize: 'var(--pf-t--global--font--size--body--sm)',
                    }}
                  >
                    {opt.description}
                  </Content>
                </div>
              </CardHeader>
            </Card>
          </GalleryItem>
        ))}
      </Gallery>
    </div>
  )
}

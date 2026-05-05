/**
 * flow: create-virtual-machine-wizard
 * step: cvm_wizard_guest_os
 *
 * OS family selection via 3-column Gallery of selectable Card tiles.
 * Each tile shows an icon badge, title, and description.
 * FormSelect below the grid is enabled only after a family is chosen.
 */
import {
  Card,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Gallery,
  GalleryItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { LinuxIcon } from '@patternfly/react-icons/dist/esm/icons/linux-icon'
import { RedhatIcon } from '@patternfly/react-icons/dist/esm/icons/redhat-icon'
import { WindowsIcon } from '@patternfly/react-icons/dist/esm/icons/windows-icon'
import type { UpdateFn, WizardState } from '../types'

// ---------------------------------------------------------------------------
// OS family data — matches terminology.os_families in the spec
// ---------------------------------------------------------------------------

const ICON_BADGE_BG = 'var(--pf-t--global--background--color--secondary--default)'

type OsFamilyKey = 'rhel' | 'windows' | 'other-linux'

interface OsFamilyCard {
  key: OsFamilyKey
  inputId: string
  cardId: string
  title: string
  description: string
  ariaLabel: string
  iconColor: string
}

const OS_FAMILY_CARDS: OsFamilyCard[] = [
  {
    key: 'rhel',
    cardId: 'guest-os-rhel-card',
    inputId: 'guest-os-rhel',
    title: 'RHEL',
    description: 'Red Hat Enterprise Linux for production workloads with long-term support.',
    ariaLabel: 'Select Red Hat Enterprise Linux',
    iconColor: '#EE0000',
  },
  {
    key: 'windows',
    cardId: 'guest-os-windows-card',
    inputId: 'guest-os-windows',
    title: 'Microsoft Windows',
    description: 'Windows Server or client images for Microsoft-based applications.',
    ariaLabel: 'Select Microsoft Windows',
    iconColor: '#00A4EF',
  },
  {
    key: 'other-linux',
    cardId: 'guest-os-other-linux-card',
    inputId: 'guest-os-other-linux',
    title: 'Other Linux',
    description: 'Community and third-party Linux distributions such as Ubuntu or Debian.',
    ariaLabel: 'Select other Linux distribution',
    iconColor: '#FFD132',
  },
]

const OS_TYPES: Record<OsFamilyKey, { value: string; label: string }[]> = {
  rhel: [
    { value: 'rhel-9-5',  label: 'Red Hat Enterprise Linux 9.5' },
    { value: 'rhel-9-4',  label: 'Red Hat Enterprise Linux 9.4' },
    { value: 'rhel-8-10', label: 'Red Hat Enterprise Linux 8.10' },
  ],
  windows: [
    { value: 'win-srv-2025', label: 'Microsoft Windows Server 2025' },
    { value: 'win-srv-2022', label: 'Microsoft Windows Server 2022' },
    { value: 'win-11',       label: 'Microsoft Windows 11' },
  ],
  'other-linux': [
    { value: 'ubuntu-2404',      label: 'Ubuntu 24.04 LTS' },
    { value: 'debian-12',        label: 'Debian 12' },
    { value: 'fedora-41',        label: 'Fedora 41' },
    { value: 'centos-stream-9',  label: 'CentOS Stream 9' },
  ],
}

function OsFamilyIcon({ familyKey, color }: { familyKey: OsFamilyKey; color: string }) {
  const iconStyle = { width: 24, height: 24, flexShrink: 0 as const, color }
  if (familyKey === 'rhel')        return <RedhatIcon aria-hidden style={iconStyle} />
  if (familyKey === 'windows')     return <WindowsIcon aria-hidden style={iconStyle} />
  return <LinuxIcon aria-hidden style={{ ...iconStyle, width: 28, height: 28 }} />
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GuestOsStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  const selectedFamily = (state.osFamilyNew as OsFamilyKey | '') || null

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h3">Guest operating system</Title>
        <Content
          component="p"
          style={{
            marginTop: 'var(--pf-t--global--spacer--xs)',
            color: 'var(--pf-t--global--text--color--subtle)',
          }}
        >
          Select the guest operating system to be installed on your virtual machine.
        </Content>
      </StackItem>

      <StackItem>
        <Gallery hasGutter minWidths={{ default: '200px' }}>
          {OS_FAMILY_CARDS.map((os) => (
            <GalleryItem key={os.key}>
              <Card
                id={os.cardId}
                isFullHeight
                isSelectable
                isSelected={selectedFamily === os.key}
              >
                <CardHeader
                  selectableActions={{
                    variant: 'single',
                    name: 'guest-os-family',
                    selectableActionId: os.inputId,
                    selectableActionAriaLabel: os.ariaLabel,
                    onChange: (_e, checked) => {
                      if (checked) {
                        update('osFamilyNew', os.key)
                        update('osTypeNew', '')
                      }
                    },
                  }}
                >
                  <Flex alignItems={{ default: 'alignItemsFlexStart' }} spaceItems={{ default: 'spaceItemsMd' }}>
                    <FlexItem>
                      {/* pf-primitive-exception: icon badge sizing requires a flex container with
                          fixed dimensions; no PF primitive expresses a 44x44 icon tile */}
                      <div
                        style={{
                          flexShrink: 0,
                          width: 44,
                          height: 44,
                          borderRadius: 'var(--pf-t--global--border--radius--medium)',
                          backgroundColor: ICON_BADGE_BG,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <OsFamilyIcon familyKey={os.key} color={os.iconColor} />
                      </div>
                    </FlexItem>
                    <FlexItem grow={{ default: 'grow' }} style={{ minWidth: 0 }}>
                      <CardTitle
                        style={{
                          fontSize: 'var(--pf-t--global--font--size--body--lg)',
                          marginBottom: 'var(--pf-t--global--spacer--xs)',
                        }}
                      >
                        {os.title}
                      </CardTitle>
                      <Content
                        component="p"
                        style={{
                          margin: 0,
                          color: 'var(--pf-t--global--text--color--subtle)',
                          fontSize: 'var(--pf-t--global--font--size--body--sm)',
                        }}
                      >
                        {os.description}
                      </Content>
                    </FlexItem>
                  </Flex>
                </CardHeader>
              </Card>
            </GalleryItem>
          ))}
        </Gallery>
      </StackItem>

      <StackItem>
        <Form>
          <FormGroup label="Guest operating system type" fieldId="guest-os-type" isRequired>
            <FormSelect
              id="guest-os-type"
              value={state.osTypeNew}
              isDisabled={!selectedFamily}
              onChange={(_e, v) => update('osTypeNew', v)}
              aria-label="Guest operating system type"
            >
              <FormSelectOption
                value=""
                label={!selectedFamily ? 'Select a guest operating system first' : 'Select a type'}
                isPlaceholder
              />
              {selectedFamily &&
                OS_TYPES[selectedFamily].map((opt) => (
                  <FormSelectOption key={opt.value} value={opt.value} label={opt.label} />
                ))}
            </FormSelect>
          </FormGroup>
        </Form>
      </StackItem>
    </Stack>
  )
}

import {
  Checkbox,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import type { ComputeInstance } from '@osac/api-contracts'
import { VM_TEMPLATES } from '@osac/api-contracts'
import { useState, type ReactNode } from 'react'
import type { UpdateFn, WizardState } from '../types'

function bootSourceSummary(bootSource: WizardState['bootSource']): string {
  if (bootSource === 'volume') return 'Boot volume'
  if (bootSource === 'none') return 'No boot source'
  return '—'
}

export function ReviewStep({
  state,
  update,
  vms = [],
}: {
  state: WizardState
  update: UpdateFn
  vms?: ComputeInstance[]
}) {
  const tpl = state.selectedTemplateId
    ? VM_TEMPLATES.find((t) => t.id === state.selectedTemplateId)
    : null
  const sourceVm = state.cloneSourceVmId ? vms.find((vm) => vm.id === state.cloneSourceVmId) ?? null : null

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const renderSection = (id: string, title: string, content: ReactNode) => (
    <ExpandableSection
      toggleText={title}
      isExpanded={expandedSections[id] ?? true}
      onToggle={(_event, isExpanded) =>
        setExpandedSections((prev) => ({
          ...prev,
          [id]: isExpanded,
        }))
      }
    >
      {content}
    </ExpandableSection>
  )

  const renderTemplateSections = () => (
    <>
      {renderSection(
        'template-overview',
        'Overview',
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Template</DescriptionListTerm>
            <DescriptionListDescription>{tpl?.title ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>VM name</DescriptionListTerm>
            <DescriptionListDescription>{state.templateVmName || '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>CPU</DescriptionListTerm>
            <DescriptionListDescription>{tpl ? `${tpl.defaultCores} vCPU` : '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Memory</DescriptionListTerm>
            <DescriptionListDescription>
              {tpl ? `${tpl.defaultMemoryGib} GiB` : '—'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Storage</DescriptionListTerm>
            <DescriptionListDescription>40 GiB root volume (demo default)</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Network</DescriptionListTerm>
            <DescriptionListDescription>Default pod network</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Headless mode</DescriptionListTerm>
            <DescriptionListDescription>{state.headless ? 'On' : 'Off'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Guest system log access</DescriptionListTerm>
            <DescriptionListDescription>{state.guestLogAccess ? 'On' : 'Off'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Deletion protection</DescriptionListTerm>
            <DescriptionListDescription>{state.logDeletion ? 'On' : 'Off'}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      )}
      {renderSection(
        'template-storage',
        'Storage',
        <Content component="p" className="pf-v6-u-color-text-subtle">
          No additional storage settings are configured in this demo.
        </Content>
      )}
      {renderSection(
        'template-network',
        'Network',
        <Content component="p" className="pf-v6-u-color-text-subtle">
          Default pod network is selected in this demo.
        </Content>
      )}
      {renderSection(
        'template-ssh',
        'SSH',
        <Content component="p" className="pf-v6-u-color-text-subtle">
          SSH key management is not modeled in this demo.
        </Content>
      )}
      {renderSection(
        'template-scheduling',
        'Scheduling',
        <Content component="p" className="pf-v6-u-color-text-subtle">
          Scheduling preferences are not modeled in this demo.
        </Content>
      )}
      {renderSection(
        'template-initial-run',
        'Initial run',
        <Content component="p" className="pf-v6-u-color-text-subtle">
          Initial run customization is not modeled in this demo.
        </Content>
      )}
      {renderSection(
        'template-metadata',
        'Metadata',
        <Content component="p" className="pf-v6-u-color-text-subtle">
          Metadata labels and annotations are not modeled in this demo.
        </Content>
      )}
    </>
  )

  const renderNewSummary = () => (
    <DescriptionList isCompact aria-labelledby="review-heading">
      <DescriptionListGroup>
        <DescriptionListTerm>Operating system</DescriptionListTerm>
        <DescriptionListDescription>{state.osTypeNew || state.osFamilyNew || '—'}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Boot source</DescriptionListTerm>
        <DescriptionListDescription>{bootSourceSummary(state.bootSource)}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>vCPU</DescriptionListTerm>
        <DescriptionListDescription>{state.cpuNew || '—'}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Memory</DescriptionListTerm>
        <DescriptionListDescription>{state.memoryNew ? `${state.memoryNew} GiB` : '—'}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Cloud-init user data</DescriptionListTerm>
        <DescriptionListDescription>{state.cloudInitUserDataNew.trim() ? 'Provided' : 'None'}</DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  )

  const renderCloneSections = () => (
    <>
      {renderSection(
        'clone-overview',
        'Overview',
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Deployment</DescriptionListTerm>
            <DescriptionListDescription>Clone</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>New virtual machine name</DescriptionListTerm>
            <DescriptionListDescription>{state.cloneNewName || '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Source virtual machine</DescriptionListTerm>
            <DescriptionListDescription>
              {sourceVm?.metadata.name ?? state.cloneSourceVmId ?? '—'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>CPU</DescriptionListTerm>
            <DescriptionListDescription>
              {sourceVm?.spec.cores ? `${sourceVm.spec.cores} vCPU` : '—'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Memory</DescriptionListTerm>
            <DescriptionListDescription>
              {sourceVm?.spec.memoryGib ? `${sourceVm.spec.memoryGib} GiB` : '—'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Storage</DescriptionListTerm>
            <DescriptionListDescription>
              {sourceVm?.spec.bootDisk || sourceVm?.spec.additionalDisks?.length
                ? `Boot disk plus ${sourceVm.spec.additionalDisks?.length ?? 0} additional disk(s)`
                : 'No storage details available'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Network</DescriptionListTerm>
            <DescriptionListDescription>{sourceVm?.spec.subnet ?? 'Default network'}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      )}
      {renderSection(
        'clone-storage',
        'Storage',
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Boot disk</DescriptionListTerm>
            <DescriptionListDescription>
              {sourceVm?.spec.bootDisk ? 'Present' : 'Not specified'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Additional disks</DescriptionListTerm>
            <DescriptionListDescription>{sourceVm?.spec.additionalDisks?.length ?? 0}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>,
      )}
      {renderSection(
        'clone-network',
        'Network',
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Subnet</DescriptionListTerm>
            <DescriptionListDescription>{sourceVm?.spec.subnet ?? 'Default network'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Security groups</DescriptionListTerm>
            <DescriptionListDescription>
              {sourceVm?.spec.securityGroups?.length
                ? sourceVm.spec.securityGroups.join(', ')
                : 'None specified'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>IP address</DescriptionListTerm>
            <DescriptionListDescription>{sourceVm?.status.ipAddress ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>,
      )}
      {renderSection(
        'clone-ssh',
        'SSH',
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>SSH key</DescriptionListTerm>
            <DescriptionListDescription>
              {sourceVm?.spec.sshKey ? 'Configured on source VM' : 'Not configured'}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>,
      )}
      {renderSection(
        'clone-scheduling',
        'Scheduling',
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Run strategy</DescriptionListTerm>
            <DescriptionListDescription>{sourceVm?.spec.runStrategy ?? 'Not specified'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Current power state</DescriptionListTerm>
            <DescriptionListDescription>{sourceVm?.status.state ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>,
      )}
      {renderSection(
        'clone-initial-run',
        'Initial run',
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>User data</DescriptionListTerm>
            <DescriptionListDescription>
              {sourceVm?.spec.userData ? 'Provided on source VM' : 'None'}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>,
      )}
      {renderSection(
        'clone-metadata',
        'Metadata',
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Source VM ID</DescriptionListTerm>
            <DescriptionListDescription>{sourceVm?.id ?? state.cloneSourceVmId ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Source VM name</DescriptionListTerm>
            <DescriptionListDescription>{sourceVm?.metadata.name ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Labels</DescriptionListTerm>
            <DescriptionListDescription>{Object.keys(sourceVm?.metadata.labels ?? {}).length}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>,
      )}
    </>
  )

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="review-heading" headingLevel="h2" size="xl">
          Review and create
        </Title>
        <Content
          component="p"
          className="pf-v6-u-color-text-subtle"
          style={{ marginTop: 'var(--pf-t--global--spacer--sm)', maxWidth: 720 }}
        >
          Confirm the choices below, then create the virtual machine.
        </Content>
      </StackItem>
      <StackItem>
        <Checkbox
          id="start-after"
          label="Start this virtual machine after creation"
          isChecked={state.startAfterCreate}
          onChange={(_e, v) => update('startAfterCreate', v)}
        />
      </StackItem>
      <StackItem>
        {state.mode === 'new' ? (
          renderNewSummary()
        ) : (
          <Stack hasGutter>
            {state.mode === 'template' && renderTemplateSections()}
            {state.mode === 'clone' && renderCloneSections()}
          </Stack>
        )}
      </StackItem>
    </Stack>
  )
}

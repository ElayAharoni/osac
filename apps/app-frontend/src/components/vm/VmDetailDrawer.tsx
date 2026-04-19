/**
 * flow: manage-virtual-machines
 * step: mvm_detail_drawer
 */
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from '@patternfly/react-core'
import { useState } from 'react'
import type { ComputeInstance, VmPowerState } from '@osac/api-contracts'
import { VmStatusLabel } from '@osac/ui-components'

interface Props {
  vm: ComputeInstance | null
  effectiveState: VmPowerState
  onClose: () => void
  onPower: (action: 'start' | 'stop' | 'restart') => void
}

export function VmDetailDrawer({ vm, effectiveState, onClose, onPower }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Drawer isExpanded={!!vm} isInline={false} position="right">
      <DrawerContent
        panelContent={
          <DrawerPanelContent widths={{ default: 'width_33', lg: 'width_50' }}>
            {vm && (
              <>
                <DrawerHead>
                  <Title headingLevel="h2" size="xl">
                    {vm.metadata.name}
                  </Title>
                  <DrawerActions>
                    <DrawerCloseButton onClick={onClose} />
                  </DrawerActions>
                </DrawerHead>
                <DrawerPanelBody>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--pf-t--global--spacer--sm)',
                      marginBottom: 'var(--pf-t--global--spacer--md)',
                    }}
                  >
                    <VmStatusLabel state={effectiveState} />
                    <div style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--xs)' }}>
                      {effectiveState !== 'running' && (
                        <Button variant="secondary" size="sm" onClick={() => onPower('start')}>
                          Start
                        </Button>
                      )}
                      {effectiveState === 'running' && (
                        <Button variant="secondary" size="sm" onClick={() => onPower('stop')}>
                          Stop
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => onPower('restart')}>
                        Restart
                      </Button>
                    </div>
                  </div>

                  <Tabs
                    activeKey={activeTab}
                    onSelect={(_e, key) => setActiveTab(Number(key))}
                    className="osac-vm-detail-tabs"
                  >
                    <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
                      <div style={{ padding: 'var(--pf-t--global--spacer--md) 0' }}>
                        <DescriptionList isCompact>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Name</DescriptionListTerm>
                            <DescriptionListDescription>{vm.metadata.name}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Status</DescriptionListTerm>
                            <DescriptionListDescription>
                              <VmStatusLabel state={effectiveState} />
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>OS</DescriptionListTerm>
                            <DescriptionListDescription style={{ textTransform: 'capitalize' }}>
                              {vm.os ?? '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>vCPU</DescriptionListTerm>
                            <DescriptionListDescription>{vm.spec.cores ?? '—'}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Memory</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.spec.memoryGib ? `${vm.spec.memoryGib} GiB` : '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          {vm.description && (
                            <DescriptionListGroup>
                              <DescriptionListTerm>Description</DescriptionListTerm>
                              <DescriptionListDescription>{vm.description}</DescriptionListDescription>
                            </DescriptionListGroup>
                          )}
                          <DescriptionListGroup>
                            <DescriptionListTerm>Created</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.metadata.createdAt
                                ? new Date(vm.metadata.createdAt).toLocaleDateString()
                                : '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </div>
                    </Tab>

                    <Tab eventKey={1} title={<TabTitleText>Networking</TabTitleText>}>
                      <div style={{ padding: 'var(--pf-t--global--spacer--md) 0' }}>
                        <DescriptionList isCompact>
                          <DescriptionListGroup>
                            <DescriptionListTerm>IP address</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.status.ipAddress ?? '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Subnet</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.spec.subnet ?? '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Security groups</DescriptionListTerm>
                            <DescriptionListDescription>
                              {vm.spec.securityGroups?.join(', ') ?? '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </div>
                    </Tab>

                    <Tab eventKey={2} title={<TabTitleText>Conditions</TabTitleText>}>
                      <div style={{ padding: 'var(--pf-t--global--spacer--md) 0' }}>
                        {vm.status.conditions && vm.status.conditions.length > 0 ? (
                          vm.status.conditions.map((c, i) => (
                            <Content key={i} component="p">
                              <strong>{c.type}:</strong> {c.status}
                              {c.message ? ` — ${c.message}` : ''}
                            </Content>
                          ))
                        ) : (
                          <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                            No conditions reported.
                          </Content>
                        )}
                      </div>
                    </Tab>
                  </Tabs>
                </DrawerPanelBody>
              </>
            )}
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody />
      </DrawerContent>
    </Drawer>
  )
}

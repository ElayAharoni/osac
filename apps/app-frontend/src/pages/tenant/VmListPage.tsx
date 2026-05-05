/**
 * flow: manage-virtual-machines
 * steps: mvm_list_view, mvm_detail_drawer
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bullseye,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
  PageSection,
  SearchInput,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core'
import type { ComputeInstance, VmPowerState } from '@osac/api-contracts'
import { VmStatusLabel } from '@osac/ui-components'
import { useSession } from '../../contexts/SessionContext'
import { useComputeInstances, useProvisionVm } from '../../api/hooks'
import { PageHeader } from '../../components/layout'
import { VmDetailDrawer } from '../../components/vm/VmDetailDrawer'
import type { CreateVmWizardHandle } from '../../components/vm/CreateVmWizard'
import { CreateVmWizard } from '../../components/vm/CreateVmWizard'
import { VmActionsMenu } from '../../components/vm/VmActionsMenu'
import { VmTable } from '../../components/vm/VmTable'

type ListMode = 'cards' | 'table'

export function VmListPage() {
  const { selectedTenant, role, topologyDetailRequest, clearTopologyDetailRequest } = useSession()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const wizardRef = useRef<CreateVmWizardHandle>(null)

  const [search, setSearch] = useState('')
  const [listMode, setListMode] = useState<ListMode>('cards')
  const [powerFilter, setPowerFilter] = useState<VmPowerState | null>(
    () => (searchParams.get('power') as VmPowerState | null) ?? null,
  )
  const [selectedVm, setSelectedVm] = useState<ComputeInstance | null>(null)
  const [vmStates, setVmStates] = useState<Map<string, VmPowerState>>(new Map())

  const { data: vms = [], isLoading } = useComputeInstances()
  const provisionVm = useProvisionVm()

  useEffect(() => {
    if (!topologyDetailRequest) return
    const vm = vms.find((v) => v.id === topologyDetailRequest.vmId)
    if (vm) setSelectedVm(vm)
    clearTopologyDetailRequest()
  }, [topologyDetailRequest, vms, clearTopologyDetailRequest])

  const handlePowerAction = useCallback(
    (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => {
      const nextState: VmPowerState =
        action === 'start' ? 'running' : action === 'stop' ? 'stopped' : 'running'
      setVmStates((prev) => new Map(prev).set(vm.id, nextState))
    },
    [],
  )

  const getEffectiveState = useCallback(
    (vm: ComputeInstance): VmPowerState => vmStates.get(vm.id) ?? vm.status.state,
    [vmStates],
  )

  const filteredVms = vms.filter((vm) => {
    const state = getEffectiveState(vm)
    const matchesSearch = !search || vm.metadata.name.toLowerCase().includes(search.toLowerCase())
    const matchesPower = !powerFilter || state === powerFilter
    return matchesSearch && matchesPower
  })

  const tenant = selectedTenant && selectedTenant !== 'vertexa' ? selectedTenant : 'northstar'

  const handleOpenCreateVm = useCallback(() => {
    wizardRef.current?.open()
  }, [])

  return (
    <PageSection isFilled>
      <CreateVmWizard
        ref={wizardRef}
        existingVms={vms}
        tenant={tenant}
        onProvision={(vm) => provisionVm.mutate(vm)}
      />

      <PageHeader
        title="My VMs"
        actions={
          <Flex
            spaceItems={{ default: 'spaceItemsMd' }}
            alignItems={{ default: 'alignItemsCenter' }}
            flexWrap={{ default: 'wrap' }}
          >
            {role === 'tenantUser' ? (
              <FlexItem>
                <Button variant="primary" onClick={handleOpenCreateVm}>
                  Create virtual machine
                </Button>
              </FlexItem>
            ) : null}
            <FlexItem>
              <SearchInput
                placeholder="Search VMs by name…"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
                style={{ minWidth: 220 }}
              />
            </FlexItem>
            <FlexItem>
              <ToggleGroup aria-label="List view mode">
                <ToggleGroupItem
                  text="Cards"
                  buttonId="view-cards"
                  isSelected={listMode === 'cards'}
                  onChange={() => setListMode('cards')}
                />
                <ToggleGroupItem
                  text="Table"
                  buttonId="view-table"
                  isSelected={listMode === 'table'}
                  onChange={() => setListMode('table')}
                />
              </ToggleGroup>
            </FlexItem>
          </Flex>
        }
      />

      <Flex
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
        style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
      >
        {(['running', 'paused', 'stopped'] as VmPowerState[]).map((state) => (
          <FlexItem key={state}>
            <Button
              variant={powerFilter === state ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setPowerFilter(powerFilter === state ? null : state)}
              style={{ textTransform: 'capitalize' }}
            >
              {state}
            </Button>
          </FlexItem>
        ))}
        {powerFilter && (
          <FlexItem>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setPowerFilter(null)
                navigate('/vms')
              }}
            >
              Clear filter
            </Button>
          </FlexItem>
        )}
      </Flex>

      {isLoading ? (
        <Bullseye style={{ padding: 'var(--pf-t--global--spacer--2xl)' }}>
          <Spinner aria-label="Loading virtual machines" />
        </Bullseye>
      ) : filteredVms.length === 0 ? (
        <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
          {search || powerFilter
            ? 'No virtual machines match your filters.'
            : 'No virtual machines yet. Create one to get started.'}
        </Content>
      ) : listMode === 'cards' ? (
        <Gallery hasGutter className="osac-vm-card-grid">
          {filteredVms.map((vm) => {
            const state = getEffectiveState(vm)
            return (
              <GalleryItem key={vm.id}>
                {/* isClickable + isSelectable allows selectableActions (whole-card click)
                    and actions (kebab menu) to coexist without a PF accessibility warning */}
                <Card
                  isClickable
                  isSelectable
                  className="osac-dashboard-vm-stat-card"
                >
                  <CardHeader
                    selectableActions={{
                      onClickAction: () => setSelectedVm(vm),
                      selectableActionAriaLabel: `View details for ${vm.metadata.name}`,
                    }}
                    actions={{
                      actions: (
                        <VmActionsMenu
                          vm={vm}
                          onPower={(a) => handlePowerAction(vm, a)}
                          onClone={() => wizardRef.current?.openFromClone(vm.id)}
                        />
                      ),
                    }}
                  >
                    <CardTitle>{vm.metadata.name}</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Flex
                      alignItems={{ default: 'alignItemsCenter' }}
                      spaceItems={{ default: 'spaceItemsSm' }}
                      style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}
                    >
                      <VmStatusLabel state={state} />
                      {vm.os && (
                        <Label
                          color="grey"
                          isCompact
                          variant="outline"
                          style={{ textTransform: 'capitalize' }}
                        >
                          {vm.os}
                        </Label>
                      )}
                    </Flex>
                    {vm.description && (
                      <Content
                        component="p"
                        style={{
                          color: 'var(--pf-t--global--text--color--subtle)',
                          fontSize: 'var(--pf-t--global--font--size--body--sm)',
                          marginTop: 'var(--pf-t--global--spacer--xs)',
                        }}
                      >
                        {vm.description}
                      </Content>
                    )}
                    <Content
                      component="p"
                      style={{
                        color: 'var(--pf-t--global--text--color--subtle)',
                        fontSize: 'var(--pf-t--global--font--size--body--sm)',
                        marginTop: 'var(--pf-t--global--spacer--xs)',
                      }}
                    >
                      {vm.spec.cores} vCPU · {vm.spec.memoryGib} GiB
                      {vm.status.ipAddress ? ` · ${vm.status.ipAddress}` : ''}
                    </Content>
                  </CardBody>
                </Card>
              </GalleryItem>
            )
          })}
        </Gallery>
      ) : (
        <VmTable
          vms={filteredVms}
          getState={getEffectiveState}
          onSelect={setSelectedVm}
          onPower={handlePowerAction}
          onClone={(vm) => wizardRef.current?.openFromClone(vm.id)}
        />
      )}

      <VmDetailDrawer
        vm={selectedVm}
        effectiveState={selectedVm ? getEffectiveState(selectedVm) : 'stopped'}
        onClose={() => setSelectedVm(null)}
        onPower={(action) => selectedVm && handlePowerAction(selectedVm, action)}
      />
    </PageSection>
  )
}

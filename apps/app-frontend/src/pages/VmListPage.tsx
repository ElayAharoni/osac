/**
 * flow: manage-virtual-machines
 * steps: mvm_list_view, mvm_detail_drawer
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  MenuToggle,
  PageSection,
  SearchInput,
  Spinner,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core'
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon'
import type { ComputeInstance, VmPowerState } from '@osac/api-contracts'
import { VmStatusLabel } from '@osac/ui-components'
import { useSession } from '../contexts/SessionContext'
import { useComputeInstances, useProvisionVm } from '../api/hooks'
import { VmDetailDrawer } from '../components/vm/VmDetailDrawer'
import type { CreateVmWizardHandle } from '../components/vm/CreateVmWizard'
import { CreateVmWizard } from '../components/vm/CreateVmWizard'

type ListMode = 'cards' | 'table'

function VmActionsDropdown({
  vm,
  onPower,
  onClone,
}: {
  vm: ComputeInstance
  onPower: (action: 'start' | 'stop' | 'restart') => void
  onClone: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      toggle={(ref) => (
        <MenuToggle
          ref={ref}
          variant="plain"
          onClick={() => setOpen((o) => !o)}
          aria-label={`Actions for ${vm.metadata.name}`}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      popperProps={{ position: 'right' }}
    >
      <DropdownList>
        {vm.status.state !== 'running' && (
          <DropdownItem value="start" onClick={() => { onPower('start'); setOpen(false) }}>
            Start
          </DropdownItem>
        )}
        {vm.status.state === 'running' && (
          <DropdownItem value="stop" onClick={() => { onPower('stop'); setOpen(false) }}>
            Stop
          </DropdownItem>
        )}
        <DropdownItem value="restart" onClick={() => { onPower('restart'); setOpen(false) }}>
          Restart
        </DropdownItem>
        <DropdownItem value="clone" onClick={() => { onClone(); setOpen(false) }}>
          Clone
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  )
}

export function VmListPage() {
  const { selectedTenant, topologyDetailRequest, clearTopologyDetailRequest } = useSession()
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

  // Consume topology detail open request
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
    const matchesSearch =
      !search || vm.metadata.name.toLowerCase().includes(search.toLowerCase())
    const matchesPower = !powerFilter || state === powerFilter
    return matchesSearch && matchesPower
  })

  const tenant = selectedTenant && selectedTenant !== 'vertexa' ? selectedTenant : 'northstar'

  return (
    <PageSection isFilled>
      <CreateVmWizard
        ref={wizardRef}
        existingVms={vms}
        tenant={tenant}
        onProvision={(vm) => provisionVm.mutate(vm)}
      />

      <div className="osac-page-toolbar-sticky">
        <div className="osac-page-toolbar-sticky__lead">
          <Title headingLevel="h1" size="2xl" style={{ margin: 0 }}>
            My VMs
          </Title>
        </div>
        <div style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--sm)', alignItems: 'center' }}>
          <SearchInput
            placeholder="Search VMs by name…"
            value={search}
            onChange={(_e, v) => setSearch(v)}
            onClear={() => setSearch('')}
            style={{ minWidth: 220 }}
          />
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
        </div>
      </div>

      {/* Power filter toggles */}
      <div style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--sm)', marginBottom: 'var(--pf-t--global--spacer--md)', flexWrap: 'wrap' }}>
        {(['running', 'paused', 'stopped'] as VmPowerState[]).map((state) => (
          <Button
            key={state}
            variant={powerFilter === state ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPowerFilter(powerFilter === state ? null : state)}
            style={{ textTransform: 'capitalize' }}
          >
            {state}
          </Button>
        ))}
        {powerFilter && (
          <Button variant="link" size="sm" onClick={() => { setPowerFilter(null); navigate('/vms') }}>
            Clear filter
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--pf-t--global--spacer--2xl)' }}>
          <Spinner aria-label="Loading virtual machines" />
        </div>
      ) : filteredVms.length === 0 ? (
        <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
          {search || powerFilter ? 'No virtual machines match your filters.' : 'No virtual machines yet. Create one to get started.'}
        </Content>
      ) : listMode === 'cards' ? (
        <div className="osac-vm-card-grid">
          {filteredVms.map((vm) => {
            const state = getEffectiveState(vm)
            return (
              <Card
                key={vm.id}
                isClickable
                className="osac-dashboard-vm-stat-card"
              >
                <CardHeader
                  selectableActions={{
                    onClickAction: () => setSelectedVm(vm),
                    selectableActionAriaLabel: `View details for ${vm.metadata.name}`,
                  }}
                  actions={{
                    actions: (
                      <VmActionsDropdown
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pf-t--global--spacer--sm)', marginBottom: 'var(--pf-t--global--spacer--xs)' }}>
                    <VmStatusLabel state={state} />
                    {vm.os && <Label color="grey" isCompact variant="outline" style={{ textTransform: 'capitalize' }}>{vm.os}</Label>}
                  </div>
                  {vm.description && (
                    <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)', fontSize: 'var(--pf-t--global--font--size--body--sm)', marginTop: 'var(--pf-t--global--spacer--xs)' }}>
                      {vm.description}
                    </Content>
                  )}
                  <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)', fontSize: 'var(--pf-t--global--font--size--body--sm)', marginTop: 'var(--pf-t--global--spacer--xs)' }}>
                    {vm.spec.cores} vCPU · {vm.spec.memoryGib} GiB
                    {vm.status.ipAddress ? ` · ${vm.status.ipAddress}` : ''}
                  </Content>
                </CardBody>
              </Card>
            )
          })}
        </div>
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

// ---------------------------------------------------------------------------
// Table view
// ---------------------------------------------------------------------------

import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table'

function VmTable({
  vms,
  getState,
  onSelect,
  onPower,
  onClone,
}: {
  vms: ComputeInstance[]
  getState: (vm: ComputeInstance) => VmPowerState
  onSelect: (vm: ComputeInstance) => void
  onPower: (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => void
  onClone: (vm: ComputeInstance) => void
}) {
  return (
    <Table aria-label="Virtual machines" variant="compact">
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Status</Th>
          <Th>OS</Th>
          <Th>vCPU</Th>
          <Th>Memory</Th>
          <Th>IP</Th>
          <Th aria-label="Actions" />
        </Tr>
      </Thead>
      <Tbody>
        {vms.map((vm) => {
          const state = getState(vm)
          return (
            <Tr
              key={vm.id}
              isClickable
              onRowClick={() => onSelect(vm)}
            >
              <Td dataLabel="Name">{vm.metadata.name}</Td>
              <Td dataLabel="Status"><VmStatusLabel state={state} /></Td>
              <Td dataLabel="OS" style={{ textTransform: 'capitalize' }}>{vm.os ?? '—'}</Td>
              <Td dataLabel="vCPU">{vm.spec.cores ?? '—'}</Td>
              <Td dataLabel="Memory">{vm.spec.memoryGib ? `${vm.spec.memoryGib} GiB` : '—'}</Td>
              <Td dataLabel="IP">{vm.status.ipAddress ?? '—'}</Td>
              <Td dataLabel="Actions" isActionCell>
                <VmActionsDropdown
                  vm={vm}
                  onPower={(a) => onPower(vm, a)}
                  onClone={() => onClone(vm)}
                />
              </Td>
            </Tr>
          )
        })}
      </Tbody>
    </Table>
  )
}

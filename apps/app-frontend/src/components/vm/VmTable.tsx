/**
 * flow: manage-virtual-machines
 * step: mvm_list_view
 */
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table'
import type { ComputeInstance, VmPowerState } from '@osac/api-contracts'
import { VmStatusLabel } from '@osac/ui-components'
import { VmActionsMenu } from './VmActionsMenu'

interface VmTableProps {
  vms: ComputeInstance[]
  getState: (vm: ComputeInstance) => VmPowerState
  onSelect: (vm: ComputeInstance) => void
  onPower: (vm: ComputeInstance, action: 'start' | 'stop' | 'restart') => void
  onClone: (vm: ComputeInstance) => void
}

export function VmTable({ vms, getState, onSelect, onPower, onClone }: VmTableProps) {
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
            <Tr key={vm.id} isClickable onRowClick={() => onSelect(vm)}>
              <Td dataLabel="Name">{vm.metadata.name}</Td>
              <Td dataLabel="Status">
                <VmStatusLabel state={state} />
              </Td>
              <Td dataLabel="OS" style={{ textTransform: 'capitalize' }}>
                {vm.os ?? '—'}
              </Td>
              <Td dataLabel="vCPU">{vm.spec.cores ?? '—'}</Td>
              <Td dataLabel="Memory">{vm.spec.memoryGib ? `${vm.spec.memoryGib} GiB` : '—'}</Td>
              <Td dataLabel="IP">{vm.status.ipAddress ?? '—'}</Td>
              <Td dataLabel="Actions" isActionCell>
                <div onClick={(e) => e.stopPropagation()}>
                  <VmActionsMenu
                    vm={vm}
                    effectiveState={state}
                    onPower={(a) => onPower(vm, a)}
                    onClone={() => onClone(vm)}
                  />
                </div>
              </Td>
            </Tr>
          )
        })}
      </Tbody>
    </Table>
  )
}

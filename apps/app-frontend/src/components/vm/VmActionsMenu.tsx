import { useState } from 'react'
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core'
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon'
import type { ComputeInstance, VmPowerState } from '@osac/api-contracts'

interface VmActionsMenuProps {
  vm: ComputeInstance
  effectiveState?: VmPowerState
  onPower: (action: 'start' | 'stop' | 'restart') => void
  /** WIZARD_TEMPLATE_ONLY: omit to hide Clone until fulfillment supports it. */
  onClone?: () => void
  onMigrate?: () => void
  onDelete?: () => void
}

export function VmActionsMenu({
  vm,
  effectiveState,
  onPower,
  onClone,
  onMigrate,
  onDelete,
}: VmActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const state = effectiveState ?? vm.status.state

  const canStart = state === 'stopped'
  const canStop = state === 'running' || state === 'paused'
  const canRestart = state === 'running' || state === 'paused'
  const canClone = typeof onClone === 'function'
  const canMigrate = state === 'running' && typeof onMigrate === 'function'
  const canDelete = state === 'stopped' && typeof onDelete === 'function'

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
        <DropdownItem
          value="start"
          isDisabled={!canStart}
          onClick={() => {
            if (!canStart) return
            onPower('start')
            setOpen(false)
          }}
        >
          Start
        </DropdownItem>
        <DropdownItem
          value="stop"
          isDisabled={!canStop}
          onClick={() => {
            if (!canStop) return
            onPower('stop')
            setOpen(false)
          }}
        >
          Stop
        </DropdownItem>
        <DropdownItem
          value="restart"
          isDisabled={!canRestart}
          onClick={() => {
            if (!canRestart) return
            onPower('restart')
            setOpen(false)
          }}
        >
          Restart
        </DropdownItem>
        {onClone ? (
          <DropdownItem
            value="clone"
            isDisabled={!canClone}
            onClick={() => {
              if (!canClone) return
              onClone()
              setOpen(false)
            }}
          >
            Clone
          </DropdownItem>
        ) : null}
        <DropdownItem
          value="migrate"
          isDisabled={!canMigrate}
          onClick={() => {
            if (!canMigrate) return
            onMigrate?.()
            setOpen(false)
          }}
        >
          Migrate
        </DropdownItem>
        <DropdownItem
          value="delete"
          isDisabled={!canDelete}
          onClick={() => {
            if (!canDelete) return
            onDelete?.()
            setOpen(false)
          }}
        >
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  )
}

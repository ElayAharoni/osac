import { useState } from 'react'
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core'
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon'
import type { ComputeInstance } from '@osac/api-contracts'

interface VmActionsMenuProps {
  vm: ComputeInstance
  onPower: (action: 'start' | 'stop' | 'restart') => void
  onClone: () => void
}

export function VmActionsMenu({ vm, onPower, onClone }: VmActionsMenuProps) {
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
          <DropdownItem
            value="start"
            onClick={() => {
              onPower('start')
              setOpen(false)
            }}
          >
            Start
          </DropdownItem>
        )}
        {vm.status.state === 'running' && (
          <DropdownItem
            value="stop"
            onClick={() => {
              onPower('stop')
              setOpen(false)
            }}
          >
            Stop
          </DropdownItem>
        )}
        <DropdownItem
          value="restart"
          onClick={() => {
            onPower('restart')
            setOpen(false)
          }}
        >
          Restart
        </DropdownItem>
        <DropdownItem
          value="clone"
          onClick={() => {
            onClone()
            setOpen(false)
          }}
        >
          Clone
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  )
}

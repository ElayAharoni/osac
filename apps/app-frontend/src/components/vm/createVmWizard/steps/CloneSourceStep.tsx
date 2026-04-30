/**
 * flow: create-virtual-machine-wizard
 * step: cvm_wizard_source_clone
 */
import {
  Button,
  Content,
  Form,
  FormGroup,
  SearchInput,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core'
import type { ComputeInstance } from '@osac/api-contracts'
import { VmStatusLabel } from '@osac/ui-components'
import type { UpdateFn, WizardState } from '../types'

interface CloneSourceStepProps {
  state: WizardState
  update: UpdateFn
  search: string
  setSearch: (s: string) => void
  vms: ComputeInstance[]
}

export function CloneSourceStep({ state, update, search, setSearch, vms }: CloneSourceStepProps) {
  return (
    <Form>
      <FormGroup label="Search VMs" fieldId="clone-search">
        <SearchInput
          id="clone-search"
          placeholder="Filter by name…"
          value={search}
          onChange={(_e, v) => setSearch(v)}
          onClear={() => setSearch('')}
        />
      </FormGroup>
      <FormGroup label="Source VM" fieldId="clone-source-list">
        <Stack hasGutter style={{ maxHeight: 200, overflowY: 'auto' }}>
          {vms.map((vm) => (
            <StackItem key={vm.id}>
              <Button
                variant="plain"
                onClick={() => {
                  update('cloneSourceVmId', vm.id)
                  update('cloneNewName', `${vm.metadata.name}-clone`)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: 'var(--pf-t--global--spacer--sm)',
                  border: `1px solid ${state.cloneSourceVmId === vm.id ? 'var(--pf-t--global--color--brand--default)' : 'var(--pf-t--global--border--color--default)'}`,
                  borderRadius: 'var(--pf-t--global--border--radius--small)',
                  padding: 'var(--pf-t--global--spacer--sm)',
                  background:
                    state.cloneSourceVmId === vm.id
                      ? 'var(--pf-t--global--color--brand--subtle)'
                      : 'var(--pf-t--global--background--color--primary--default)',
                  textAlign: 'left',
                }}
              >
                <VmStatusLabel state={vm.status.state} />
                <Content component="small" style={{ fontWeight: 600, margin: 0 }}>
                  {vm.metadata.name}
                </Content>
              </Button>
            </StackItem>
          ))}
          {vms.length === 0 && (
            <StackItem>
              <Content component="p" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                No VMs match your search.
              </Content>
            </StackItem>
          )}
        </Stack>
      </FormGroup>
      <FormGroup label="New VM name" fieldId="clone-new-name" isRequired>
        <TextInput
          id="clone-new-name"
          value={state.cloneNewName}
          onChange={(_e, v) => update('cloneNewName', v)}
          placeholder="Enter a name for the cloned VM"
        />
      </FormGroup>
    </Form>
  )
}

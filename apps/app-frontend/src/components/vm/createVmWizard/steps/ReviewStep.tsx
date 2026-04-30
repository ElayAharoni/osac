import {
  Checkbox,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { VM_TEMPLATES } from '@osac/api-contracts'
import type { UpdateFn, WizardState } from '../types'

export function ReviewStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  const tpl = state.selectedTemplateId
    ? VM_TEMPLATES.find((t) => t.id === state.selectedTemplateId)
    : null

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList isCompact style={{ marginBottom: 'var(--pf-t--global--spacer--lg)' }}>
          <DescriptionListGroup>
            <DescriptionListTerm>Deployment method</DescriptionListTerm>
            <DescriptionListDescription>
              {state.mode === 'new'
                ? 'New from scratch'
                : state.mode === 'template'
                  ? 'From template'
                  : 'Clone'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {tpl && (
            <DescriptionListGroup>
              <DescriptionListTerm>Template</DescriptionListTerm>
              <DescriptionListDescription>{tpl.title}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {state.mode === 'new' && (
            <>
              <DescriptionListGroup>
                <DescriptionListTerm>Operating system</DescriptionListTerm>
                <DescriptionListDescription>
                  {state.osTypeNew || state.osFamilyNew || '—'}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>vCPU</DescriptionListTerm>
                <DescriptionListDescription>{state.cpuNew || '—'}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Memory</DescriptionListTerm>
                <DescriptionListDescription>
                  {state.memoryNew ? `${state.memoryNew} GiB` : '—'}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </>
          )}
          {state.mode === 'template' && state.templateVmName && (
            <DescriptionListGroup>
              <DescriptionListTerm>VM name</DescriptionListTerm>
              <DescriptionListDescription>{state.templateVmName}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {state.mode === 'clone' && (
            <DescriptionListGroup>
              <DescriptionListTerm>New VM name</DescriptionListTerm>
              <DescriptionListDescription>{state.cloneNewName || '—'}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </StackItem>
      <StackItem>
        <Checkbox
          id="start-after"
          label="Start virtual machine after creation"
          isChecked={state.startAfterCreate}
          onChange={(_e, v) => update('startAfterCreate', v)}
        />
      </StackItem>
    </Stack>
  )
}

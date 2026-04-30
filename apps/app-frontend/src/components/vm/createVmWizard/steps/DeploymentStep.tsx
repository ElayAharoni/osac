import { Form, FormGroup, Radio, Stack, StackItem } from '@patternfly/react-core'
import type { DeploymentMode, UpdateFn, WizardState } from '../types'

export function DeploymentStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      <FormGroup label="How do you want to create this VM?" fieldId="deploy-method">
        <Stack hasGutter>
          {(
            [
              {
                value: 'new',
                label: 'New virtual machine (from scratch)',
                desc: 'Configure OS, compute, and storage manually.',
              },
              {
                value: 'template',
                label: 'From template',
                desc: 'Start from a predefined configuration.',
              },
              {
                value: 'clone',
                label: 'Clone existing VM',
                desc: 'Duplicate an existing virtual machine.',
              },
            ] as { value: DeploymentMode; label: string; desc: string }[]
          ).map((m) => (
            <StackItem key={m.value}>
              <Radio
                id={`deploy-${m.value}`}
                name="deployMethod"
                label={m.label}
                description={m.desc}
                isChecked={state.mode === m.value}
                onChange={() => update('mode', m.value)}
              />
            </StackItem>
          ))}
        </Stack>
      </FormGroup>
    </Form>
  )
}

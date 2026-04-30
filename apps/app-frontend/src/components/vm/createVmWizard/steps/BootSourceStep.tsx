import { Form, FormGroup, Radio, Stack, StackItem } from '@patternfly/react-core'
import type { UpdateFn, WizardState } from '../types'

export function BootSourceStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      <FormGroup label="Boot source" fieldId="boot-source" isRequired>
        <Stack hasGutter>
          <StackItem>
            <Radio
              id="boot-volume"
              name="bootSource"
              label="Boot from volume"
              description="Attach a persistent boot disk."
              isChecked={state.bootSource === 'volume'}
              onChange={() => update('bootSource', 'volume')}
            />
          </StackItem>
          <StackItem>
            <Radio
              id="boot-none"
              name="bootSource"
              label="No boot source"
              description="VM boots from PXE or network; no persistent disk attached."
              isChecked={state.bootSource === 'none'}
              onChange={() => update('bootSource', 'none')}
            />
          </StackItem>
        </Stack>
      </FormGroup>
    </Form>
  )
}

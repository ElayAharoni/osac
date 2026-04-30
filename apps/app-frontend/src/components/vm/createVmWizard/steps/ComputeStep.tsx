import { Form, FormGroup, TextInput } from '@patternfly/react-core'
import type { UpdateFn, WizardState } from '../types'

export function ComputeStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      <FormGroup label="vCPU count" fieldId="cpu" isRequired>
        <TextInput
          id="cpu"
          type="number"
          value={state.cpuNew}
          onChange={(_e, v) => update('cpuNew', v)}
          min={1}
        />
      </FormGroup>
      <FormGroup label="Memory (GiB)" fieldId="memory" isRequired>
        <TextInput
          id="memory"
          type="number"
          value={state.memoryNew}
          onChange={(_e, v) => update('memoryNew', v)}
          min={1}
        />
      </FormGroup>
    </Form>
  )
}

import { Checkbox, Form, FormGroup, TextInput } from '@patternfly/react-core'
import type { UpdateFn, WizardState } from '../types'

export function CustomizationStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      {state.mode === 'template' && (
        <FormGroup label="Virtual machine name" fieldId="template-vm-name" isRequired>
          <TextInput
            id="template-vm-name"
            value={state.templateVmName}
            onChange={(_e, v) => update('templateVmName', v)}
            placeholder="Enter a name for this virtual machine"
          />
        </FormGroup>
      )}
      {state.mode === 'new' && (
        <FormGroup label="Hostname (optional)" fieldId="hostname">
          <TextInput
            id="hostname"
            value={state.hostnameNew}
            onChange={(_e, v) => update('hostnameNew', v)}
            placeholder="Leave blank to auto-generate"
          />
        </FormGroup>
      )}
      {state.mode === 'template' && (
        <>
          <Checkbox
            id="headless"
            label="Run headless (no display)"
            isChecked={state.headless}
            onChange={(_e, v) => update('headless', v)}
          />
          <Checkbox
            id="log-deletion"
            label="Enable log deletion protection"
            isChecked={state.logDeletion}
            onChange={(_e, v) => update('logDeletion', v)}
          />
        </>
      )}
    </Form>
  )
}

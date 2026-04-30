import {
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Radio,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { OS_FAMILIES, OS_TYPES } from '../constants'
import type { UpdateFn, WizardState } from '../types'

export function GuestOsStep({ state, update }: { state: WizardState; update: UpdateFn }) {
  return (
    <Form>
      <FormGroup label="OS family" fieldId="os-family" isRequired>
        <Stack hasGutter>
          {OS_FAMILIES.map((f) => (
            <StackItem key={f.id}>
              <Radio
                id={`os-fam-${f.id}`}
                name="osFamily"
                label={f.label}
                isChecked={state.osFamilyNew === f.id}
                onChange={() => {
                  update('osFamilyNew', f.id)
                  update('osTypeNew', '')
                }}
              />
            </StackItem>
          ))}
        </Stack>
      </FormGroup>
      {state.osFamilyNew && (
        <FormGroup label="OS version" fieldId="os-type" isRequired>
          <FormSelect
            id="os-type"
            value={state.osTypeNew}
            onChange={(_e, v) => update('osTypeNew', v)}
          >
            <FormSelectOption value="" label="Select a version…" isPlaceholder />
            {(OS_TYPES[state.osFamilyNew] ?? []).map((t) => (
              <FormSelectOption key={t} value={t} label={t} />
            ))}
          </FormSelect>
        </FormGroup>
      )}
    </Form>
  )
}

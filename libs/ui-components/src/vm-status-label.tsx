import { Label } from '@patternfly/react-core'
import type { VmPowerState } from '@osac/api-contracts'

interface VmStatusLabelProps {
  state: VmPowerState
}

const STATE_MAP: Record<
  VmPowerState,
  { color: 'green' | 'orange' | 'red' | 'blue' | 'grey'; text: string }
> = {
  running: { color: 'green', text: 'Running' },
  paused: { color: 'orange', text: 'Paused' },
  stopped: { color: 'red', text: 'Stopped' },
  starting: { color: 'blue', text: 'Starting' },
  deleting: { color: 'grey', text: 'Deleting' },
  error: { color: 'red', text: 'Error' },
}

export function VmStatusLabel({ state }: VmStatusLabelProps) {
  const { color, text } = STATE_MAP[state] ?? { color: 'grey', text: state }
  return (
    <Label color={color} isCompact>
      {text}
    </Label>
  )
}

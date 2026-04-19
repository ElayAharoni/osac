import { Button } from '@patternfly/react-core'
import { MoonIcon } from '@patternfly/react-icons/dist/esm/icons/moon-icon'
import { SunIcon } from '@patternfly/react-icons/dist/esm/icons/sun-icon'

interface LightDarkToggleProps {
  isDark: boolean
  onChange: (isDark: boolean) => void
  'aria-label'?: string
  /** Shell variant shows a landing shortcut next to the toggle. */
  variant?: 'landing' | 'shell'
  landingOnSelect?: () => void
  landingAriaLabel?: string
}

export function LightDarkToggle({
  isDark,
  onChange,
  'aria-label': ariaLabel = 'Toggle theme',
  variant,
  landingOnSelect,
  landingAriaLabel,
}: LightDarkToggleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pf-t--global--spacer--xs)' }}>
      {variant === 'shell' && landingOnSelect && (
        <Button
          variant="link"
          isInline
          onClick={landingOnSelect}
          aria-label={landingAriaLabel ?? 'Back to welcome'}
          style={{ fontSize: 'var(--pf-t--global--font--size--body--sm)' }}
        >
          ← Home
        </Button>
      )}
      <Button
        variant="plain"
        aria-label={ariaLabel}
        onClick={() => onChange(!isDark)}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </Button>
    </div>
  )
}

import { cx } from '../lib/cx'
import { useMode } from '../state/mode'
import type { Mode } from '../sim/types'

const OPTIONS: { value: Mode; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'technical', label: 'Technical' },
]

/** Switches every explanation in the app between plain language and protocol detail. */
export function ModeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useMode()
  return (
    <div role="radiogroup" aria-label="Explanation level" className={cx('inline-flex rounded-lg border border-rule bg-paper p-0.5 text-xs', className)}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={mode === o.value}
          onClick={() => setMode(o.value)}
          className={cx(
            'rounded-md px-2.5 py-1 font-medium transition-colors',
            mode === o.value ? 'bg-rule text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

import { cx } from '../../lib/cx'

/** A row of mutually exclusive buttons for lab settings. */
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-md border-[1.5px] border-edge px-3 py-1.5 text-sm font-bold transition-colors',
            value === o.value ? 'bg-fg text-card' : 'bg-card text-fg hover:bg-tint-marker',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

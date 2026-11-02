import { Moon, Sun } from 'lucide-react'
import { cx } from '../../lib/cx'
import { useTheme } from '../../state/theme'

/** One button: shows the theme you'd switch to. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cx('grid h-9 w-9 place-items-center rounded-md border-[1.5px] border-edge bg-card text-fg transition-colors hover:bg-tint-marker', className)}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

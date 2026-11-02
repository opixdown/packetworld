import { Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react'
import { SPEEDS, type Playback } from '../hooks/usePlayback'
import { cx } from '../lib/cx'
import { formatMs } from '../sim/builder'

interface Props {
  playback: Playback
  total: number
  className?: string
}

/**
 * Restart, back, play/next, scrub, and the autoplay switch. In guided mode the
 * simulation stops after every step; autoplay keeps going on its own.
 * Keyboard: Space, ← and →.
 */
export function SimulationControls({ playback: p, total, className }: Props) {
  const icon = 'grid h-10 w-10 place-items-center rounded-md text-fg transition-colors hover:bg-wash disabled:opacity-30 disabled:hover:bg-transparent'
  return (
    <div className={cx('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      <div className="flex items-center gap-1">
        <button className={icon} onClick={p.restart} aria-label="Start again" title="Start again">
          <RotateCcw size={17} />
        </button>
        <button className={icon} onClick={p.prev} disabled={p.index === 0} aria-label="Previous step" title="Previous step (←)">
          <StepBack size={17} />
        </button>
        <button
          className="grid h-11 w-11 place-items-center rounded-md bg-fg text-card shadow-note-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          onClick={p.toggle}
          aria-label={p.playing ? 'Pause' : 'Play'}
          title={p.playing ? 'Pause (Space)' : p.guided ? 'Play this step (Space)' : 'Play (Space)'}
        >
          {p.playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="translate-x-px" />}
        </button>
        <button className={icon} onClick={p.next} disabled={p.done} aria-label="Next step" title="Next step (→)">
          <StepForward size={17} />
        </button>
      </div>

      <label className="flex min-w-[140px] flex-1 items-center gap-3">
        <span className="sr-only">Jump to step</span>
        <input type="range" min={0} max={Math.max(0, total - 1)} value={p.index} onChange={(e) => p.seek(Number(e.target.value))} className="pw-range w-full" />
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-fg-muted">
          {p.index + 1}/{total}
        </span>
      </label>

      <div className="flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-fg" title="Off: the simulation stops after every step so you can read. On: it keeps playing.">
          <span className="relative inline-flex h-6 w-10 items-center">
            <input type="checkbox" className="peer sr-only" checked={!p.guided} onChange={(e) => p.setGuided(!e.target.checked)} />
            <span className="absolute inset-0 rounded-full border-[1.5px] border-edge bg-card transition-colors peer-checked:bg-fg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-proto-tcp" />
            <span className="absolute left-1 h-4 w-4 rounded-full bg-fg transition-transform peer-checked:translate-x-4 peer-checked:bg-card" />
          </span>
          Autoplay
        </label>
        {!p.guided && (
          <div role="radiogroup" aria-label="Speed" className="flex rounded-md border-[1.5px] border-edge p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={p.speed === s}
                onClick={() => p.setSpeed(s)}
                className={cx('rounded px-1.5 py-0.5 font-mono text-xs', p.speed === s ? 'bg-fg text-card' : 'text-fg-muted hover:text-fg')}
              >
                {s}×
              </button>
            ))}
          </div>
        )}
        <span className="hidden whitespace-nowrap font-mono text-xs tabular-nums text-fg-faint sm:inline" title="Simulated time since the journey started">
          t = {formatMs(p.simTime)}
        </span>
      </div>
    </div>
  )
}

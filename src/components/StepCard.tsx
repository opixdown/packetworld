import { ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Playback } from '../hooks/usePlayback'
import { cx } from '../lib/cx'
import { PROTOCOL_CLASSES, STAGE_INFO } from '../lib/protocols'
import { addressing } from '../sim/topology'
import type { Journey } from '../sim/types'
import { useMode } from '../state/mode'
import { TermText } from './TermText'

type Extra = 'why' | 'life' | 'tech'

/**
 * The reading companion for the simulation. Short by default: one or two
 * sentences. "Why?", "Real-life example" and "Technical detail" open only when
 * asked for, so learners read less and explore more.
 */
export function StepCard({ journey, playback: p, className }: { journey: Journey; playback: Playback; className?: string }) {
  const { mode } = useMode()
  const [open, setOpen] = useState<Extra | null>(null)
  useEffect(() => {
    setOpen(null)
  }, [p.index])

  const e = p.event
  if (!e) return null
  const stage = STAGE_INFO[e.stage]
  const c = PROTOCOL_CLASSES[e.packet?.protocol ?? stage.protocol]
  const addr = addressing(journey.target)
  const why = e.packet?.beginner.why ?? e.why
  const life = e.packet?.beginner.analogy ?? e.analogy
  const main = mode === 'beginner' ? e.beginner : e.technical
  const last = p.index === journey.events.length - 1
  const finished = last && p.stepDone

  const watch = e.packet
    ? `The ${e.packet.label} packet travels from ${addr[e.packet.from].name.toLowerCase()} to ${addr[e.packet.to].name.toLowerCase()}.${
        e.packet.fate === 'lost' ? ' Watch it get lost on the way.' : e.packet.fate === 'ignored' ? ' Nobody answers it.' : ''
      }`
    : `${addr[e.actor].name} is working. No packet moves in this step.`

  const extras: { key: Extra; label: string; body?: string }[] = [
    { key: 'why', label: 'Why?', body: why },
    { key: 'life', label: 'Real-life example', body: life },
    { key: 'tech', label: mode === 'beginner' ? 'Technical detail' : 'Simple version', body: mode === 'beginner' ? e.technical : e.beginner },
  ]

  return (
    <section className={cx('flex flex-col rounded-md border-[1.5px] border-edge bg-card shadow-note', className)} aria-live="polite" aria-label="Current step">
      <header className={cx('flex items-center justify-between gap-3 border-b-[1.5px] border-edge px-4 py-2', c.tint)}>
        <span className={cx('font-mono text-xs font-semibold uppercase tracking-wide', c.text)}>
          {stage.name} · {stage.title}
        </span>
        <span className="font-mono text-xs text-fg-muted">
          step {p.index + 1}/{journey.events.length}
        </span>
      </header>

      <div className="flex-1 px-4 pb-3 pt-4">
        <h3 className="font-display text-xl font-semibold leading-snug text-fg sm:text-[1.4rem]">{e.title}</h3>
        <p className="mt-2 text-[1.02rem] leading-relaxed text-fg">
          <TermText text={main} />
        </p>

        <p className="mt-3 flex items-start gap-2 text-sm text-fg-muted">
          <Eye size={15} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold text-fg">Watch: </span>
            {watch}
          </span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {extras
            .filter((x) => x.body)
            .map((x) => (
              <button
                key={x.key}
                onClick={() => setOpen(open === x.key ? null : x.key)}
                aria-expanded={open === x.key}
                className={cx(
                  'rounded-full border-[1.5px] px-3 py-1 text-sm font-semibold transition-colors',
                  open === x.key ? 'border-edge bg-fg text-card' : 'border-edge/70 text-fg hover:bg-tint-marker',
                )}
              >
                {x.label}
              </button>
            ))}
        </div>
        {open && (
          <div className="mt-3 animate-fade-up border-l-4 border-proto-dns/70 bg-paper/70 px-3 py-2 text-[0.95rem] leading-relaxed text-fg">
            <TermText text={extras.find((x) => x.key === open)!.body!} />
          </div>
        )}
      </div>

      <footer className="flex items-center gap-2 border-t border-rule px-4 py-3">
        <button
          onClick={p.prev}
          disabled={p.index === 0}
          className="inline-flex h-11 items-center gap-1.5 rounded-md border-[1.5px] border-edge px-3 text-sm font-semibold text-fg transition-colors hover:bg-wash disabled:opacity-30"
        >
          <ArrowLeft size={16} /> Back
        </button>
        {finished ? (
          <button onClick={p.restart} className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-md bg-fg px-4 text-sm font-semibold text-card shadow-note-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            <RotateCcw size={16} /> Watch again
          </button>
        ) : (
          <button
            onClick={p.stepDone || p.playing ? p.next : p.play}
            className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-md bg-fg px-4 text-sm font-semibold text-card shadow-note-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {p.index === 0 && !p.stepDone && !p.playing ? 'Start' : 'Next'} <ArrowRight size={16} />
          </button>
        )}
      </footer>
    </section>
  )
}

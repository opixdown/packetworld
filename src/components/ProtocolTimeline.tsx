import { Check, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cx } from '../lib/cx'
import { PROTOCOL_CLASSES, PROTOCOL_COLOR, STAGE_INFO } from '../lib/protocols'
import { STAGES } from '../sim/journey'
import type { Journey } from '../sim/types'

interface Props {
  journey: Journey
  index: number
  progress: number
  onSeek: (index: number) => void
  className?: string
}

/** The four stages as a progress strip. Click a stage to jump to its first step. */
export function ProtocolTimeline({ journey, index, progress, onSeek, className }: Props) {
  const failed = journey.outcome !== 'success' && journey.outcome !== 'http-error'
  const lastStage = journey.stages[journey.stages.length - 1]?.stage
  return (
    <nav aria-label="Journey stages" className={cx('grid grid-cols-4 gap-1.5', className)}>
      {STAGES.map((stage, n) => {
        const span = journey.stages.find((s) => s.stage === stage)
        const info = STAGE_INFO[stage]
        const color = PROTOCOL_COLOR[info.protocol]
        let fill = 0
        if (span) {
          const count = span.lastIndex - span.firstIndex + 1
          fill = Math.max(0, Math.min(1, (index - span.firstIndex + (index >= span.firstIndex ? progress : 0)) / count))
        }
        const current = span && index >= span.firstIndex && index <= span.lastIndex
        const complete = fill >= 1
        const broke = failed && stage === lastStage && complete
        return (
          <button
            key={stage}
            disabled={!span}
            onClick={() => span && onSeek(span.firstIndex)}
            className={cx(
              'group relative overflow-hidden rounded-md border-[1.5px] px-2.5 py-2 text-left transition-colors sm:px-3',
              current ? cx('border-edge shadow-note-sm', PROTOCOL_CLASSES[info.protocol].tint) : 'border-edge/30 bg-card hover:border-edge',
              !span && 'cursor-not-allowed opacity-40',
            )}
            aria-current={current ? 'step' : undefined}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-2xs text-fg-faint">{n + 1}</span>
              <span className={cx('text-sm font-semibold', PROTOCOL_CLASSES[info.protocol].text)}>{info.name}</span>
              {complete && !broke && <Check size={13} className="text-fg-faint" />}
              {broke && <X size={13} className="text-proto-error" />}
            </div>
            <div className="mt-0.5 hidden truncate text-2xs text-fg-faint sm:block">{span ? info.title : 'not reached'}</div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-rule">
              <div className="h-full transition-[width] duration-150" style={{ width: `${fill * 100}%`, background: broke ? 'rgb(var(--pw-error))' : color }} />
            </div>
          </button>
        )
      })}
    </nav>
  )
}

/** Every step of the journey as a clickable list. */
export function StepList({ journey, index, onSeek, className }: { journey: Journey; index: number; onSeek: (i: number) => void; className?: string }) {
  const listRef = useRef<HTMLOListElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  // Scroll only the list itself: scrollIntoView would also scroll the page.
  useEffect(() => {
    const list = listRef.current
    const item = activeRef.current
    if (!list || !item || list.clientHeight === 0) return
    const top = item.offsetTop - list.offsetTop
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - list.clientHeight / 2
    }
  }, [index])
  return (
    <ol ref={listRef} className={cx('relative space-y-0.5', className)}>
      {journey.events.map((e, i) => {
        const proto = e.packet?.protocol ?? STAGE_INFO[e.stage].protocol
        const c = PROTOCOL_CLASSES[proto]
        return (
          <li key={e.id}>
            <button
              ref={i === index ? activeRef : undefined}
              onClick={() => onSeek(i)}
              className={cx(
                'flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-xs transition-colors',
                i === index ? 'bg-rule text-fg' : i < index ? 'text-fg-muted hover:bg-wash' : 'text-fg-faint hover:bg-wash',
              )}
            >
              <span className="w-5 shrink-0 text-right font-mono text-2xs text-fg-faint">{i + 1}</span>
              <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', e.kind === 'packet' ? c.dot : 'bg-rule-strong')} />
              <span className={cx('truncate', e.kind === 'packet' && 'font-mono', e.tone === 'error' && 'text-proto-error', e.tone === 'warning' && 'text-proto-warn')}>
                {e.kind === 'packet' ? `${e.packet!.from} → ${e.packet!.to}: ${e.title}` : e.title}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

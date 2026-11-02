import { AnimatePresence, motion } from 'framer-motion'
import { cx } from '../lib/cx'
import { STAGE_INFO } from '../lib/protocols'
import { formatMs } from '../sim/builder'
import type { SimEvent } from '../sim/types'
import { useMode } from '../state/mode'
import { ProtocolBadge } from './ProtocolBadge'

const TONE_BORDER = {
  info: 'border-l-rule-strong',
  success: 'border-l-proto-http',
  warning: 'border-l-proto-warn',
  error: 'border-l-proto-error',
}

/** Narrates the current step, in beginner or technical language. */
export function ExplanationPanel({ event, index, total, className }: { event?: SimEvent; index: number; total: number; className?: string }) {
  const { mode } = useMode()
  if (!event) return null
  const stage = STAGE_INFO[event.stage]
  return (
    <div className={cx('rounded-md border border-l-2 border-rule bg-card px-4 py-3.5', TONE_BORDER[event.tone], className)} aria-live="polite">
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-2xs text-fg-faint">
        <ProtocolBadge protocol={stage.protocol} label={`${stage.name} · ${stage.title}`} />
        <span className="font-mono">
          Step {index + 1} of {total}
        </span>
        <span className="font-mono">
          {event.skipsTime ? 'time skipped ahead' : `t = ${formatMs(event.t)}`}
          {event.duration > 0 && !event.skipsTime && ` · ${formatMs(event.duration)}`}
        </span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${event.id}-${mode}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          <h3 className="text-[15px] font-semibold text-fg">{event.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{mode === 'beginner' ? event.beginner : event.technical}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

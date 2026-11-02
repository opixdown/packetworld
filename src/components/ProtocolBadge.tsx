import { cx } from '../lib/cx'
import { PROTOCOL_CLASSES, PROTOCOL_NAME } from '../lib/protocols'
import type { Protocol } from '../sim/types'

export function ProtocolBadge({ protocol, label, className }: { protocol: Protocol; label?: string; className?: string }) {
  const c = PROTOCOL_CLASSES[protocol]
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-2xs font-medium', c.text, c.bg, c.border, className)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', c.dot)} />
      {label ?? PROTOCOL_NAME[protocol]}
    </span>
  )
}

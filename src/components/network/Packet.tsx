import { PAPER } from '../../lib/protocols'
import type { Fate } from '../../sim/types'

export interface PacketProps {
  x: number
  y: number
  label: string
  color: string
  tint: string
  encrypted?: boolean
  retransmission?: boolean
  fate: Fate
  /** 0–1 animation progress of the step, used for loss and arrival effects. */
  progress: number
  opacity?: number
  selected?: boolean
  onSelect?: (el: Element) => void
}

/** Rough text width for the pill, in px at 11.5px monospace. */
const width = (label: string, encrypted?: boolean) => label.length * 7 + 22 + (encrypted ? 14 : 0)

/**
 * A packet in flight, drawn like a highlighted label stuck on the line: the
 * tint and ink say which protocol it carries; a lock means the payload is
 * encrypted. Lost packets are crossed out mid-route; ignored ones reach their
 * destination and get no answer.
 */
export function Packet({ x, y, label, color, tint, encrypted, retransmission, fate, progress, opacity = 1, selected, onSelect }: PacketProps) {
  const w = width(label, encrypted)
  const h = 24
  const lostNow = fate === 'lost' && progress > 0.82
  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ opacity }}
      role="button"
      tabIndex={0}
      aria-label={`Packet: ${label}. Click to learn what it is.`}
      className="cursor-pointer outline-none"
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(e.currentTarget)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(e.currentTarget)
        }
      }}
    >
      {/* A flat offset edge, like a paper tag. */}
      <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w} height={h} rx={5} fill={PAPER.edge} opacity={lostNow ? 0.15 : 1} />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={5}
        fill={tint}
        stroke={selected ? PAPER.ink : color}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={retransmission ? '4 3' : undefined}
        style={{ opacity: lostNow ? 0.45 : 1, transition: 'opacity 200ms' }}
      />
      {encrypted && (
        <g transform={`translate(${-w / 2 + 9} -6)`} stroke={color} fill="none" strokeWidth={1.5}>
          <rect x={0} y={4.5} width={9} height={7} rx={1.5} fill={color} />
          <path d="M2 4.5V3a2.5 2.5 0 0 1 5 0v1.5" />
        </g>
      )}
      <text x={encrypted ? 7 : 0} y={4} textAnchor="middle" fontSize={11.5} fill={color} className="font-mono" fontWeight={600} style={{ opacity: lostNow ? 0.45 : 1 }}>
        {label}
      </text>
      {lostNow && (
        <g stroke={PAPER.ink} strokeWidth={2.5} strokeLinecap="round">
          <path d={`M${-w / 2 - 4} 3L${w / 2 + 4} -3`} stroke="rgb(var(--pw-error))" />
        </g>
      )}
      {fate === 'ignored' && progress >= 1 && (
        <text x={w / 2 + 8} y={4} fontSize={11.5} fill="rgb(var(--pw-warn))" className="font-mono">
          no reply
        </text>
      )}
    </g>
  )
}

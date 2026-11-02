import { BookOpenCheck, Globe, Laptop, Network, Router, Search, Server, type LucideIcon } from 'lucide-react'
import { PAPER } from '../../lib/protocols'
import type { NodeId } from '../../sim/types'

const ICONS: Record<NodeId, LucideIcon> = {
  client: Laptop,
  router: Router,
  resolver: Search,
  root: Globe,
  tld: Network,
  auth: BookOpenCheck,
  server: Server,
}

export interface NetworkNodeProps {
  id: NodeId
  x: number
  y: number
  w: number
  h: number
  label: string
  sublabel: string
  /** The node is doing something in the current step. */
  active?: boolean
  /** The node takes no part in the current stage. */
  dimmed?: boolean
  selected?: boolean
  accent: string
  accentTint: string
  /** Smaller type and icon, for the phone layout. */
  compact?: boolean
  onSelect?: (id: NodeId, el: Element) => void
}

/**
 * A machine on the map: an index card with an ink border. The small "i" in the
 * corner says "click me to learn what this is".
 */
export function NetworkNode({ id, x, y, w, h, label, sublabel, active, dimmed, selected, accent, accentTint, compact, onSelect }: NetworkNodeProps) {
  const Icon = ICONS[id]
  const left = x - w / 2
  const top = y - h / 2
  const tile = compact ? 24 : 30
  const glyph = compact ? 14 : 16
  const textX = left + (compact ? 38 : 50)
  const edge = active ? accent : PAPER.edge
  return (
    <g>
      {/* Solid backing, so lines never show through a dimmed card. */}
      <rect x={left} y={top} width={w + 3} height={h + 3} rx={6} fill={PAPER.paper} />
    <g
      role="button"
      tabIndex={0}
      aria-label={`${label}, ${sublabel}. Click to learn what this machine does.`}
      className="cursor-pointer outline-none transition-opacity duration-300 [&:focus-visible>rect.frame]:stroke-[3px]"
      style={{ opacity: dimmed ? 0.4 : 1 }}
      onClick={(e) => onSelect?.(id, e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(id, e.currentTarget)
        }
      }}
    >
      {/* Offset edge: the card sits on the paper. */}
      <rect x={left + 3} y={top + 3} width={w} height={h} rx={6} fill={edge} />
      <rect className="frame" x={left} y={top} width={w} height={h} rx={6} fill={active ? accentTint : PAPER.card} stroke={selected ? PAPER.ink : edge} strokeWidth={selected ? 2.5 : 1.5} />
      <rect x={left + 8} y={y - tile / 2} width={tile} height={tile} rx={5} fill={active ? PAPER.card : PAPER.wash} stroke={active ? accent : 'none'} />
      <Icon x={left + 8 + (tile - glyph) / 2} y={y - glyph / 2} width={glyph} height={glyph} color={active ? accent : PAPER.ink} strokeWidth={1.8} />
      <text x={textX} y={y - 3} fill={PAPER.ink} fontSize={compact ? 11.5 : 13} fontWeight={700}>
        {label}
      </text>
      <text x={textX} y={y + (compact ? 12 : 14)} fill={PAPER.faint} fontSize={compact ? 9.5 : 10.5} className="font-mono">
        {sublabel}
      </text>
      {/* "Learn about me" marker */}
      <g transform={`translate(${left + w - 2} ${top + 2})`}>
        <circle r={8} fill={PAPER.ink} />
        <text y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill={PAPER.card} className="font-display" fontStyle="italic">
          i
        </text>
      </g>
    </g>
    </g>
  )
}

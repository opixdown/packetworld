import { useEffect, useRef } from 'react'
import type { Playback } from '../hooks/usePlayback'
import { PROTOCOL_COLOR } from '../lib/protocols'
import { addressing } from '../sim/topology'
import type { Journey, NodeId, TcpState } from '../sim/types'
import { easeTravel } from './network/layout'

interface Props {
  journey: Journey
  playback: Playback
  /** Left to right. Packets between other nodes are skipped. */
  columns: NodeId[]
  selectedIndex: number | null
  onSelect: (index: number, el: Element) => void
  /** Show TCP state boxes on the client and server lifelines. */
  showTcpState?: boolean
}

const ROW = 52
const TOP = 70
const COL_PAD = 70

const STATE_COLOR: Record<TcpState, string> = {
  CLOSED: 'rgb(var(--pw-fg-faint))',
  LISTEN: 'rgb(var(--pw-fg-muted))',
  'SYN-SENT': 'rgb(var(--pw-tcp))',
  'SYN-RECEIVED': 'rgb(var(--pw-tcp))',
  ESTABLISHED: 'rgb(var(--pw-http))',
}

/**
 * A sequence ("ladder") diagram: one vertical line per machine, time flowing
 * down, each packet a sloped arrow. This is how protocol handshakes are drawn
 * in RFCs and textbooks, so learners meet the real notation.
 */
export function SequenceDiagram({ journey, playback, columns, selectedIndex, onSelect, showTcpState }: Props) {
  const width = 640
  const addr = addressing(journey.target)
  const x = (n: NodeId) => COL_PAD + (columns.indexOf(n) * (width - 2 * COL_PAD)) / Math.max(1, columns.length - 1)
  const rows = journey.events
  const height = TOP + rows.length * ROW + 30
  const scroller = useRef<HTMLDivElement>(null)
  const y = (i: number) => TOP + i * ROW + 18

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const target = (y(playback.index) / height) * el.scrollHeight - el.clientHeight / 2
    el.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [playback.index, height])

  const visible = (i: number) => i < playback.index || (i === playback.index && playback.progress > 0)

  return (
    <div ref={scroller} className="max-h-[520px] overflow-y-auto rounded-md border-[1.5px] border-edge bg-card">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full select-none" role="group" aria-label="Sequence diagram">
        {columns.map((n) => (
          <g key={n}>
            <line x1={x(n)} x2={x(n)} y1={48} y2={height - 10} stroke="rgb(var(--pw-rule-strong))" strokeWidth={1.5} />
            <rect x={x(n) - 58 + 3} y={13} width={116} height={30} rx={5} fill="rgb(var(--pw-edge))" /><rect x={x(n) - 58} y={10} width={116} height={30} rx={5} fill="rgb(var(--pw-card))" stroke="rgb(var(--pw-edge))" strokeWidth={1.5} />
            <text x={x(n)} y={30} textAnchor="middle" fontSize={12} fill="rgb(var(--pw-fg))" fontWeight={700}>
              {addr[n].name}
            </text>
          </g>
        ))}
        {showTcpState &&
          (['client', 'server'] as NodeId[])
            .filter((n) => columns.includes(n))
            .map((n) => {
              const state = n === 'client' ? playback.world.tcpClient : playback.world.tcpServer
              return (
                <text key={n} x={x(n)} y={60} textAnchor="middle" fontSize={10} className="font-mono" fill={STATE_COLOR[state]}>
                  {state}
                </text>
              )
            })}

        {rows.map((e, i) => {
          if (!visible(i)) return null
          const current = i === playback.index
          const yy = y(i)
          if (e.kind === 'local') {
            if (!columns.includes(e.actor)) return null
            const color = e.tone === 'error' ? 'rgb(var(--pw-error))' : e.tone === 'warning' ? 'rgb(var(--pw-warn))' : e.tone === 'success' ? 'rgb(var(--pw-http))' : 'rgb(var(--pw-fg-muted))'
            const left = x(e.actor) < width / 2
            const label = e.title.length > 42 ? `${e.title.slice(0, 41)}…` : e.title
            return (
              <g key={e.id} opacity={current ? 1 : 0.7}>
                <circle cx={x(e.actor)} cy={yy} r={4} fill={color} />
                <text x={x(e.actor) + (left ? 10 : -10)} y={yy + 4} textAnchor={left ? 'start' : 'end'} fontSize={11} fill={color}>
                  {label}
                </text>
              </g>
            )
          }
          const p = e.packet!
          if (!columns.includes(p.from) || !columns.includes(p.to)) return null
          const x1 = x(p.from)
          const x2 = x(p.to)
          const color = PROTOCOL_COLOR[p.protocol]
          const t = current ? easeTravel(playback.progress) : 1
          const reach = p.fate === 'lost' ? 0.55 : 1
          const endX = x1 + (x2 - x1) * reach
          const endY = yy + (ROW - 16) * reach
          const curX = x1 + (endX - x1) * Math.min(1, t)
          const curY = yy + (endY - yy) * Math.min(1, t)
          const selected = selectedIndex === i
          const midX = (x1 + x2) / 2
          return (
            <g key={e.id} className="cursor-pointer" onClick={(ev) => onSelect(i, ev.currentTarget)} opacity={current || selected ? 1 : 0.75}>
              <line x1={x1} y1={yy} x2={curX} y2={curY} stroke={color} strokeWidth={selected ? 2.5 : 1.75} strokeDasharray={p.retransmission ? '5 4' : undefined} />
              {t >= 1 && p.fate === 'delivered' && <circle cx={endX} cy={endY} r={3.5} fill={color} />}
              {t >= 1 && p.fate === 'ignored' && (
                <text x={endX + (x2 > x1 ? -8 : 8)} y={endY + 16} textAnchor={x2 > x1 ? 'end' : 'start'} fontSize={10.5} fill="rgb(var(--pw-warn))">
                  no reply
                </text>
              )}
              {t >= 1 && p.fate === 'lost' && (
                <g stroke="rgb(var(--pw-error))" strokeWidth={2.5} strokeLinecap="round">
                  <path d={`M${endX - 6} ${endY - 6}L${endX + 6} ${endY + 6}M${endX + 6} ${endY - 6}L${endX - 6} ${endY + 6}`} />
                </g>
              )}
              <rect x={midX - p.label.length * 3.6 - 10} y={yy + (ROW - 16) * 0.5 * reach - 21} width={p.label.length * 7.2 + 20} height={18} rx={9} fill="rgb(var(--pw-card))" stroke={selected ? 'rgb(var(--pw-fg))' : color} strokeOpacity={selected ? 1 : 0.5} />
              <text x={midX} y={yy + (ROW - 16) * 0.5 * reach - 8} textAnchor="middle" fontSize={11} fill={color} className="font-mono" fontWeight={600}>
                {p.label}
              </text>
              {current && t < 1 && <circle cx={curX} cy={curY} r={5} fill={color} />}
              {/* A wide invisible hit area makes thin arrows easy to click. */}
              <line x1={x1} y1={yy} x2={endX} y2={endY} stroke="transparent" strokeWidth={16} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

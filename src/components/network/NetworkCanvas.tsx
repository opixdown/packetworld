import { useMemo } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { Playback } from '../../hooks/usePlayback'
import { PAPER, PROTOCOL_COLOR, PROTOCOL_TINT, STAGE_INFO } from '../../lib/protocols'
import { addressing } from '../../sim/topology'
import type { Journey, NodeId, TcpState } from '../../sim/types'
import { ConnectionLine } from './ConnectionLine'
import { LINKS, TALL, WIDE, along, easeTravel, linkId, route, type CanvasLayout, type Point } from './layout'
import { NetworkNode } from './NetworkNode'
import { Packet } from './Packet'

const DNS_NODES: NodeId[] = ['client', 'router', 'resolver', 'root', 'tld', 'auth']
const CONNECTION_NODES: NodeId[] = ['client', 'router', 'server']

export interface Selection {
  kind: 'node' | 'packet'
  /** Node id, or the index of the packet's event. */
  id: NodeId | number
}

interface Props {
  journey: Journey
  playback: Playback
  selection: Selection | null
  /** `el` is the tapped element, so an explainer bubble can open next to it. */
  onSelect: (s: Selection, el: Element) => void
  /** Hide the DNS infrastructure, e.g. for the handshake lessons. */
  nodes?: NodeId[]
}

/** Where a straight line from `c` towards `toward` leaves a w×h box centred on `c`. */
function edge(c: Point, toward: Point, w: number, h: number): Point {
  const dx = toward.x - c.x
  const dy = toward.y - c.y
  if (dx === 0 && dy === 0) return c
  const s = Math.min(dx === 0 ? Infinity : w / 2 / Math.abs(dx), dy === 0 ? Infinity : h / 2 / Math.abs(dy))
  return { x: c.x + dx * s, y: c.y + dy * s }
}

export function NetworkCanvas({ journey, playback, selection, onSelect, nodes }: Props) {
  const tall = useMediaQuery('(max-width: 640px)')
  const L: CanvasLayout = tall ? TALL : WIDE
  const addr = useMemo(() => addressing(journey.target), [journey.target])
  const visible = new Set<NodeId>(nodes ?? (Object.keys(L.pos) as NodeId[]))
  const { event, progress, world } = playback
  const stage = event?.stage ?? 'dns'
  const stageColor = PROTOCOL_COLOR[STAGE_INFO[stage].protocol]
  const stageTint = PROTOCOL_TINT[STAGE_INFO[stage].protocol]
  const involved = stage === 'dns' ? DNS_NODES : CONNECTION_NODES

  const packet = event?.packet
  const packetColor = packet ? PROTOCOL_COLOR[packet.protocol] : undefined
  const hops = packet ? route(packet.from, packet.to) : []
  const activeLinks = new Set(hops.slice(1).map((n, i) => linkId(hops[i], n)))

  let packetPos: Point | null = null
  let packetOpacity = 1
  if (packet) {
    const pts = hops.map((n) => L.pos[n])
    pts[0] = edge(pts[0], pts[1], L.node.w, L.node.h)
    pts[pts.length - 1] = edge(pts[pts.length - 1], pts[pts.length - 2], L.node.w, L.node.h)
    const eased = easeTravel(progress)
    packetPos = along(pts, packet.fate === 'lost' ? eased * 0.55 : eased)
    packetOpacity = Math.min(1, progress / 0.08)
    if (packet.fate === 'lost' && progress > 0.82) packetOpacity = Math.max(0, 1 - (progress - 0.82) / 0.18) * 0.9 + 0.1
  }

  const clientServer = { a: L.pos.router, b: L.pos.server }
  const lockAt = along([clientServer.a, clientServer.b], 0.42)
  const showTcp = stage !== 'dns'

  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      className="h-auto w-full select-none font-sans"
      role="group"
      aria-label="Network diagram. Select a machine or packet to inspect it."
    >
      {LINKS.filter((l) => visible.has(l.a) && visible.has(l.b)).map((l) => (
        <ConnectionLine key={linkId(l.a, l.b)} a={L.pos[l.a]} b={L.pos[l.b]} kind={l.kind} activeColor={activeLinks.has(linkId(l.a, l.b)) ? packetColor : undefined} />
      ))}

      {visible.has('server') && (
        <text x={L.internetLabel.x} y={L.internetLabel.y} textAnchor={L.internetLabel.anchor} fill={PAPER.faint} fontSize={11.5} fontStyle="italic" className="font-display">
          {tall ? 'across the internet' : 'across the internet · many routers, path chosen hop by hop'}
        </text>
      )}

      {visible.has('server') && world.tls !== 'none' && world.tls !== 'negotiating' && (
        <LinkBadge at={lockAt} tone={world.tls === 'secure' ? 'secure' : 'insecure'} label={world.tls === 'secure' ? 'Encrypted' : world.tls === 'failed' ? 'Not trusted' : 'Not encrypted'} />
      )}

      {(Object.keys(L.pos) as NodeId[])
        .filter((id) => visible.has(id))
        .map((id) => {
          const p = L.pos[id]
          const a = addr[id]
          const active = event?.actor === id || (packet?.to === id && progress >= 0.98)
          return (
            <g key={id}>
              <NetworkNode
                id={id}
                x={p.x}
                y={p.y}
                w={L.node.w}
                h={L.node.h}
                label={tall ? shortLabel(id) : a.name}
                sublabel={id === 'server' && !world.resolvedIp ? 'address unknown' : id === 'router' ? '198.51.100.7' : a.ip}
                active={active}
                dimmed={!involved.includes(id)}
                selected={selection?.kind === 'node' && selection.id === id}
                accent={stageColor}
                accentTint={stageTint}
                compact={tall}
                onSelect={(n, el) => onSelect({ kind: 'node', id: n }, el)}
              />
              {showTcp && id === 'client' && <StateChip at={p} offset={L.node.h / 2 + 16} state={world.tcpClient} />}
              {showTcp && id === 'server' && <StateChip at={p} offset={L.node.h / 2 + 16} state={world.tcpServer} />}
            </g>
          )
        })}

      {event?.kind === 'local' && visible.has(event.actor) && (
        <Caption at={L.pos[event.actor]} nodeH={L.node.h} text={event.title} tone={event.tone} width={L.width} />
      )}

      {packet && packetPos && packetColor && (
        <Packet
          x={packetPos.x}
          y={packetPos.y}
          label={packet.label}
          color={packetColor}
          tint={PROTOCOL_TINT[packet.protocol]}
          encrypted={packet.encrypted}
          retransmission={packet.retransmission}
          fate={packet.fate}
          progress={progress}
          opacity={packetOpacity}
          selected={selection?.kind === 'packet' && selection.id === playback.index}
          onSelect={(el) => onSelect({ kind: 'packet', id: playback.index }, el)}
        />
      )}
    </svg>
  )
}

function shortLabel(id: NodeId): string {
  return { client: 'Browser', router: 'Router', resolver: 'Resolver', root: 'Root', tld: 'TLD', auth: 'Authoritative', server: 'Server' }[id]
}

const STATE_COLOR: Record<TcpState, string> = {
  CLOSED: 'rgb(var(--pw-fg-faint))',
  LISTEN: 'rgb(var(--pw-fg-muted))',
  'SYN-SENT': 'rgb(var(--pw-tcp))',
  'SYN-RECEIVED': 'rgb(var(--pw-tcp))',
  ESTABLISHED: 'rgb(var(--pw-http))',
}

function StateChip({ at, offset, state }: { at: Point; offset: number; state: TcpState }) {
  const w = state.length * 7 + 46
  return (
    <g transform={`translate(${at.x} ${at.y + offset})`}>
      <rect x={-w / 2} y={-10} width={w} height={20} rx={4} fill={PAPER.card} stroke={STATE_COLOR[state]} strokeWidth={1.25} />
      <text x={0} y={4} textAnchor="middle" fontSize={10} className="font-mono" fill={STATE_COLOR[state]}>
        <tspan fill="rgb(var(--pw-fg-faint))">TCP </tspan>
        {state}
      </text>
    </g>
  )
}

function LinkBadge({ at, tone, label }: { at: Point; tone: 'secure' | 'insecure'; label: string }) {
  const color = tone === 'secure' ? 'rgb(var(--pw-tls))' : 'rgb(var(--pw-warn))'
  const w = label.length * 6.4 + 34
  return (
    <g transform={`translate(${at.x} ${at.y - 18})`}>
      <rect x={-w / 2} y={-11} width={w} height={22} rx={4} fill={tone === 'secure' ? PROTOCOL_TINT.tls : 'rgb(var(--pw-t-warn))'} stroke={color} strokeWidth={1.25} />
      <g transform={`translate(${-w / 2 + 10} -6)`} stroke={color} fill="none" strokeWidth={1.4}>
        <rect x={0} y={4.5} width={9} height={7} rx={1.5} fill={color} fillOpacity={0.25} />
        <path d={tone === 'secure' ? 'M2 4.5V3a2.5 2.5 0 0 1 5 0v1.5' : 'M2 4.5V3a2.5 2.5 0 0 1 5 0'} />
      </g>
      <text x={8} y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>
        {label}
      </text>
    </g>
  )
}

function Caption({ at, nodeH, text, tone, width }: { at: Point; nodeH: number; text: string; tone: string; width: number }) {
  const label = text.length > 46 ? `${text.slice(0, 45)}…` : text
  const w = label.length * 6.3 + 24
  // A dark "sticky note" so the current action stands out from the cards.
  const color = tone === 'error' ? 'rgb(var(--pw-error))' : tone === 'warning' ? 'rgb(var(--pw-warn))' : tone === 'success' ? 'rgb(var(--pw-http))' : PAPER.ink
  // Keep the bubble inside the canvas.
  const x = Math.max(w / 2 + 6, Math.min(width - w / 2 - 6, at.x))
  // Above the node, or below it when there is no room at the top.
  const above = at.y - nodeH / 2 - 22
  const y = above < 16 ? at.y + nodeH / 2 + 22 : above
  return (
    // The CSS animation sits on an inner group: a CSS transform would replace the SVG transform attribute.
    <g transform={`translate(${x} ${y})`} className="pointer-events-none">
      <g className="animate-fade-up">
        <rect x={-w / 2} y={-13} width={w} height={26} rx={4} fill={color} />
        <path d="M-6 13 L0 19 L6 13 Z" fill={color} transform={above < 16 ? 'rotate(180) translate(0 0)' : undefined} />
        <text x={0} y={4} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={PAPER.card}>
          {label}
        </text>
      </g>
    </g>
  )
}

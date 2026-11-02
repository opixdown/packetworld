import { ArrowRight, Eye, Lock, Pin, PinOff } from 'lucide-react'
import { useState } from 'react'
import { NODE_CONTENT } from '../content/nodes'
import { cx } from '../lib/cx'
import { PROTOCOL_CLASSES } from '../lib/protocols'
import { addressing } from '../sim/topology'
import type { Journey, Layer, NodeId, Packet, SimEvent, WorldState } from '../sim/types'
import { useMode } from '../state/mode'
import { ModeToggle } from './ModeToggle'
import type { Selection } from './network/NetworkCanvas'
import { ProtocolBadge } from './ProtocolBadge'

interface Props {
  journey: Journey
  /** The pinned selection, or null to follow the current step. */
  selection: Selection | null
  current?: SimEvent
  world: WorldState
  onUnpin: () => void
  className?: string
}

/**
 * Shows whatever is selected: a packet (its layers, fields and meaning) or a
 * machine (its role and address). Follows the current step unless pinned.
 */
export function PacketInspector({ journey, selection, current, world, onUnpin, className }: Props) {
  const pinned = selection !== null
  let body: JSX.Element
  if (selection?.kind === 'node') {
    body = <NodeDetails journey={journey} id={selection.id as NodeId} world={world} current={current} />
  } else {
    const event = selection?.kind === 'packet' ? journey.events[selection.id as number] : current
    body = event?.packet ? (
      <PacketDetails journey={journey} packet={event.packet} />
    ) : event ? (
      <NodeDetails journey={journey} id={event.actor} world={world} current={current} />
    ) : (
      <p className="text-sm text-fg-muted">Press play to start.</p>
    )
  }
  return (
    <section className={cx('flex min-h-0 flex-col rounded-md border-[1.5px] border-edge bg-card', className)} aria-label="Inspector">
      <header className="flex items-center justify-between gap-2 border-b border-rule px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base font-semibold text-fg">Inspector</h2>
          {pinned ? (
            <button onClick={onUnpin} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs text-fg-faint hover:bg-rule hover:text-fg" title="Unpin and follow the current step again">
              <PinOff size={11} /> Pinned
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-2xs text-fg-faint">
              <Pin size={11} /> Live
            </span>
          )}
        </div>
        <ModeToggle />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{body}</div>
    </section>
  )
}

function PacketDetails({ journey, packet }: { journey: Journey; packet: Packet }) {
  const { mode } = useMode()
  const addr = addressing(journey.target)
  const c = PROTOCOL_CLASSES[packet.protocol]
  const ex = mode === 'beginner' ? packet.beginner : packet.technical
  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cx('font-mono text-base font-semibold', c.text)}>{packet.label}</h3>
          <ProtocolBadge protocol={packet.protocol} />
          {packet.encrypted && (
            <span className="inline-flex items-center gap-1 rounded-full border border-proto-tls/40 px-2 py-0.5 text-2xs text-proto-tls">
              <Lock size={10} /> encrypted
            </span>
          )}
          {packet.retransmission && <span className="rounded-full border border-proto-warn/40 px-2 py-0.5 text-2xs text-proto-warn">retransmission</span>}
          {packet.fate === 'lost' && <span className="rounded-full border border-proto-error/40 px-2 py-0.5 text-2xs text-proto-error">lost in transit</span>}
          {packet.fate === 'ignored' && <span className="rounded-full border border-proto-warn/40 px-2 py-0.5 text-2xs text-proto-warn">no reply</span>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
          <span>{addr[packet.from].name}</span>
          <ArrowRight size={12} className="text-fg-faint" />
          <span>{addr[packet.to].name}</span>
        </div>
        <div className="mt-1 font-mono text-2xs text-fg-faint">
          {packet.src.ip}:{packet.src.port} → {packet.dst.ip}:{packet.dst.port} · {packet.transport}
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-bold text-fg-muted">What it does</dt>
          <dd className="mt-1 leading-relaxed text-fg">{ex.what}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-fg-muted">Why it matters</dt>
          <dd className="mt-1 leading-relaxed text-fg-muted">{ex.why}</dd>
        </div>
        {mode === 'beginner' && packet.beginner.analogy && (
          <div>
            <dt className="text-xs font-bold text-fg-muted">Real-life comparison</dt>
            <dd className="mt-1 leading-relaxed text-fg-muted">{packet.beginner.analogy}</dd>
          </div>
        )}
      </dl>

      {mode === 'beginner' ? <SimpleSummary packet={packet} /> : <Layers layers={packet.layers} />}

      {packet.observerSees && (
        <div className="rounded-lg border border-rule bg-paper/60 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-fg-muted">
            <Eye size={12} /> What someone on the network can see
          </div>
          <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-fg-muted">
            {packet.observerSees.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SimpleSummary({ packet }: { packet: Packet }) {
  const rows: [string, string][] = [
    ['From', `${packet.src.ip} (port ${packet.src.port})`],
    ['To', `${packet.dst.ip} (port ${packet.dst.port})`],
    ['Carried by', packet.transport === 'UDP' ? 'UDP: quick, no delivery guarantee' : 'TCP: reliable, in order'],
    ['Size', packet.payloadBytes > 0 ? `${packet.payloadBytes.toLocaleString()} bytes of data` : 'No data, just control flags'],
  ]
  return (
    <div className="rounded-lg border border-rule">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-3 border-b border-rule px-3 py-2 text-xs last:border-0">
          <span className="w-20 shrink-0 text-fg-faint">{k}</span>
          <span className="text-fg-muted">{v}</span>
        </div>
      ))}
      <p className="px-3 py-2 text-2xs text-fg-faint">Switch to Technical to see every header field.</p>
    </div>
  )
}

function Layers({ layers }: { layers: Layer[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-fg-muted">Layers, outermost first</div>
      {layers.map((layer, i) => {
        const c = PROTOCOL_CLASSES[layer.protocol]
        const isOpen = open[i] ?? i >= layers.length - 2
        return (
          <div key={i} className={cx('overflow-hidden rounded-lg border', c.border)} style={{ marginLeft: Math.min(i, 3) * 8 }}>
            <button
              className={cx('flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs font-semibold', c.bg, c.text)}
              onClick={() => setOpen({ ...open, [i]: !isOpen })}
              aria-expanded={isOpen}
            >
              <span className="font-mono">{layer.name}</span>
              <span className="flex items-center gap-2 font-normal text-fg-faint">
                {layer.encrypted && (
                  <span className="inline-flex items-center gap-1 text-proto-tls">
                    <Lock size={10} /> only the endpoints can read this
                  </span>
                )}
                <span>{isOpen ? '−' : '+'}</span>
              </span>
            </button>
            {isOpen && (
              <dl className="divide-y divide-rule/70 bg-paper/50">
                {layer.fields.map((f) => (
                  <div key={f.name} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-3 px-3 py-1.5 text-xs">
                    <dt className="text-fg-faint">{f.name}</dt>
                    <dd className="min-w-0">
                      <span className={cx('break-words font-mono text-fg', f.name === 'Raw message' && 'block whitespace-pre-wrap text-2xs leading-relaxed')}>{f.value}</span>
                      {f.note && <span className="mt-0.5 block text-2xs leading-snug text-fg-faint">{f.note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )
      })}
      <p className="text-2xs leading-snug text-fg-faint">
        Addresses are as seen at your computer, before your router’s NAT. All values are simulated.
      </p>
    </div>
  )
}

function NodeDetails({ journey, id, world, current }: { journey: Journey; id: NodeId; world: WorldState; current?: SimEvent }) {
  const { mode } = useMode()
  const a = addressing(journey.target)[id]
  const content = NODE_CONTENT[id]
  const acting = current && (current.actor === id || current.packet?.to === id)
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-fg">{a.name}</h3>
        <p className="text-xs text-fg-muted">{content.role}</p>
        <div className="mt-2 space-y-0.5 font-mono text-2xs text-fg-faint">
          {a.hostname && <div>{a.hostname}</div>}
          <div>{id === 'server' && !world.resolvedIp ? 'Address not known yet: DNS has not answered' : a.ip}</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-fg">{mode === 'beginner' ? content.beginner : content.technical}</p>
      {mode === 'beginner' && content.analogy && <p className="text-sm leading-relaxed text-fg-muted">Think of it as: {content.analogy}</p>}
      {(id === 'client' || id === 'server') && (
        <div className="rounded-lg border border-rule px-3 py-2 font-mono text-xs text-fg-muted">
          TCP state: <span className="text-proto-tcp">{id === 'client' ? world.tcpClient : world.tcpServer}</span>
          {id === 'client' && (
            <>
              <br />
              TLS: <span className="text-proto-tls">{world.tls}</span>
            </>
          )}
        </div>
      )}
      {acting && current && (
        <div className="rounded-lg border border-rule bg-paper/60 p-3 text-xs">
          <div className="mb-1 text-xs font-bold text-fg-muted">Right now</div>
          <div className="text-fg">{current.title}</div>
        </div>
      )}
      <p className="text-2xs text-fg-faint">Machines here are simulated. Apart from the root server, their addresses come from ranges reserved for documentation.</p>
    </div>
  )
}

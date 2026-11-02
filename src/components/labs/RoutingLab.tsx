import { Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cx } from '../../lib/cx'
import { DEST_NETWORK, ROUTERS, ROUTER_LINKS, forwardPath, linkKey, routingTable, type RouterId } from '../../sim/routing'

const pos = Object.fromEntries(ROUTERS.map((r) => [r.id, r])) as unknown as Record<RouterId, { x: number; y: number }>
const HOP_MS = 700

/** Lesson 8: routers forward hop by hop from their own tables. Cut links and watch routes change. */
export function RoutingLab() {
  const [down, setDown] = useState<Set<string>>(new Set())
  const [hop, setHop] = useState<number | null>(null)
  const table = useMemo(() => routingTable(down), [down])
  const path = useMemo(() => forwardPath(down), [down])

  useEffect(() => {
    if (hop === null || !path) return
    if (hop >= path.length - 1) return
    const id = setTimeout(() => setHop(hop + 1), HOP_MS)
    return () => clearTimeout(id)
  }, [hop, path])

  const toggle = (k: string) => {
    const next = new Set(down)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    setDown(next)
    setHop(null)
  }

  const at = hop !== null && path ? path[hop] : null
  const ttl = hop !== null ? 64 - hop : 64
  const arrived = path && hop === path.length - 1

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setHop(0)} className="pw-btn-primary px-3 py-1.5">
          <Send size={14} /> Send a packet to {DEST_NETWORK.replace('.0/24', '.48')}
        </button>
        <span className="text-sm text-fg-muted">Click a link to cut it (or repair it).</span>
      </div>

      <div className="overflow-hidden rounded-md border-[1.5px] border-edge bg-card">
        <svg viewBox="0 0 660 320" className="h-auto w-full select-none">
          {ROUTER_LINKS.map((l) => {
            const k = linkKey(l.a, l.b)
            const isDown = down.has(k)
            const onPath = path && path.some((p, i) => i > 0 && linkKey(path[i - 1], p) === k)
            const a = pos[l.a]
            const b = pos[l.b]
            return (
              <g key={k} className="cursor-pointer" onClick={() => toggle(k)} role="button" aria-label={`Link ${l.a}–${l.b}, cost ${l.cost}, ${isDown ? 'down' : 'up'}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={18} />
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isDown ? 'rgb(var(--pw-error))' : onPath ? 'rgb(var(--pw-tcp))' : 'rgb(var(--pw-rule-strong))'} strokeWidth={onPath && !isDown ? 2.5 : 2} strokeDasharray={isDown ? '6 6' : undefined} strokeOpacity={isDown ? 0.7 : 1} />
                <g transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}>
                  <rect x={-11} y={-10} width={22} height={20} rx={6} fill="rgb(var(--pw-card))" stroke={isDown ? 'rgb(var(--pw-error))' : 'rgb(var(--pw-rule-strong))'} />
                  <text y={4} textAnchor="middle" fontSize={11} className="font-mono" fill={isDown ? 'rgb(var(--pw-error))' : 'rgb(var(--pw-fg-muted))'}>
                    {isDown ? '✕' : l.cost}
                  </text>
                </g>
              </g>
            )
          })}
          {/* Your network and the destination network */}
          <line x1={20} y1={160} x2={pos.A.x} y2={pos.A.y} stroke="rgb(var(--pw-rule-strong))" strokeWidth={2} />
          <text x={14} y={145} fontSize={11} fill="rgb(var(--pw-fg-faint))">
            you
          </text>
          <line x1={pos.F.x} y1={pos.F.y} x2={630} y2={40} stroke="rgb(var(--pw-http))" strokeOpacity={0.5} strokeWidth={2} />
          <text x={640} y={30} textAnchor="end" fontSize={11} className="font-mono" fill="rgb(var(--pw-http))">
            {DEST_NETWORK}
          </text>

          {ROUTERS.map((r) => {
            const isAt = at === r.id
            return (
              <g key={r.id} transform={`translate(${r.x} ${r.y})`}>
                <circle r={22} fill="rgb(var(--pw-card))" stroke={isAt ? 'rgb(var(--pw-tcp))' : 'rgb(var(--pw-rule-strong))'} strokeWidth={isAt ? 2 : 1.5} />
                <text y={5} textAnchor="middle" fontSize={14} fontWeight={600} fill="rgb(var(--pw-fg))">
                  {r.id}
                </text>
              </g>
            )
          })}

          {at && (
            <g transform={`translate(${pos[at].x} ${pos[at].y - 38})`} className="transition-transform duration-500">
              <rect x={-44} y={-12} width={88} height={24} rx={12} fill="rgb(var(--pw-card))" stroke="rgb(var(--pw-tcp))" />
              <text y={4} textAnchor="middle" fontSize={11} className="font-mono" fill="rgb(var(--pw-tcp))">
                TTL {ttl}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div aria-live="polite" className="min-h-[2.5rem] text-sm text-fg-muted">
        {!path && <span className="text-proto-error">No route to {DEST_NETWORK}. Router A would drop the packet and send back an ICMP “destination unreachable” message.</span>}
        {path && hop === null && (
          <span>
            Current path: <span className="font-mono text-fg">{path.join(' → ')}</span>. No router knows this whole path; each only knows its next hop.
          </span>
        )}
        {path && at && !arrived && (
          <span>
            Router <strong className="text-fg">{at}</strong> looks up {DEST_NETWORK} in its table and forwards to <strong className="text-fg">{table[at].next}</strong>. TTL drops by one at every router.
          </span>
        )}
        {arrived && <span className="text-proto-http">Delivered after {path!.length - 1} hops. TTL is now {ttl}.</span>}
      </div>

      <div className="overflow-x-auto rounded-md border-[1.5px] border-edge">
        <table className="w-full text-left text-xs">
          <thead className="bg-card text-fg-faint">
            <tr>
              <th className="px-3 py-2 font-normal">Router</th>
              <th className="px-3 py-2 font-normal">Destination</th>
              <th className="px-3 py-2 font-normal">Next hop</th>
              <th className="px-3 py-2 font-normal">Path cost</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {ROUTERS.map((r) => (
              <tr key={r.id} className={cx('border-t border-rule', at === r.id && 'bg-proto-tcp/10')}>
                <td className="px-3 py-1.5 font-semibold">{r.id}</td>
                <td className="px-3 py-1.5 text-fg-muted">{DEST_NETWORK}</td>
                <td className="px-3 py-1.5">{r.id === 'F' ? 'directly connected' : (table[r.id].next ?? <span className="text-proto-error">unreachable</span>)}</td>
                <td className="px-3 py-1.5 text-fg-muted">{Number.isFinite(table[r.id].cost) ? table[r.id].cost : '∞'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-fg-faint">
        Tables here update instantly. Real routers learn routes from routing protocols (OSPF or IS-IS inside one network, BGP between networks) and take time to converge after a failure; packets can be lost in the meantime.
      </p>
    </div>
  )
}

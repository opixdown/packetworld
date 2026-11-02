import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../../lib/cx'

// Lesson 9: NAT and a stateful firewall. Each action shows one packet's
// addresses inside your home network and outside on the internet.

const WAN = '198.51.100.7'
const SERVER = '203.0.113.48:443'

interface NatEntry {
  inside: string
  outside: string
  remote: string
}

interface Shot {
  title: string
  inside: { src: string; dst: string } | null
  outside: { src: string; dst: string }
  verdict: 'forwarded' | 'translated back' | 'dropped'
  text: string
}

type Action = 'laptop' | 'phone' | 'reply' | 'stranger'

export function NatLab() {
  const [table, setTable] = useState<NatEntry[]>([])
  const [forward, setForward] = useState(false)
  const [shot, setShot] = useState<Shot | null>(null)

  const run = (a: Action) => {
    if (a === 'laptop' || a === 'phone') {
      const inside = a === 'laptop' ? '192.168.1.23:52144' : '192.168.1.40:50500'
      const existing = table.find((e) => e.inside === inside)
      const outside = existing?.outside ?? `${WAN}:${40112 + table.length}`
      if (!existing) setTable([...table, { inside, outside, remote: SERVER }])
      setShot({
        title: `${a === 'laptop' ? 'Laptop' : 'Phone'} connects to a website`,
        inside: { src: inside, dst: SERVER },
        outside: { src: outside, dst: SERVER },
        verdict: 'forwarded',
        text: `The router swaps the private source address for its single public one and remembers the swap in its NAT table. ${existing ? 'This connection already had an entry, so it is reused.' : 'A new entry is created.'}`,
      })
    } else if (a === 'reply') {
      const entry = table[0]
      if (!entry) {
        setShot({
          title: 'Server reply',
          inside: null,
          outside: { src: SERVER, dst: `${WAN}:40112` },
          verdict: 'dropped',
          text: 'There is no NAT entry for this port yet, so the router has no idea which device it is for. Open a connection from the laptop first.',
        })
        return
      }
      setShot({
        title: 'The website replies',
        inside: { src: SERVER, dst: entry.inside },
        outside: { src: SERVER, dst: entry.outside },
        verdict: 'translated back',
        text: `The reply is addressed to the router's public address. The router looks up ${entry.outside} in its NAT table and rewrites the destination back to ${entry.inside}.`,
      })
    } else {
      const allowed = forward
      setShot({
        title: 'A stranger on the internet sends a packet',
        inside: allowed ? { src: '192.0.2.200:61000', dst: '192.168.1.23:8080' } : null,
        outside: { src: '192.0.2.200:61000', dst: `${WAN}:8080` },
        verdict: allowed ? 'forwarded' : 'dropped',
        text: allowed
          ? 'You set up a port forward, so the router sends traffic for port 8080 to the laptop. Only do this for services you mean to expose.'
          : 'Nobody inside asked for this. With no NAT entry and no port forward, the router’s firewall drops it. This is why devices at home are not directly reachable from the internet.',
      })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button className="pw-btn-secondary px-3 py-1.5" onClick={() => run('laptop')}>
          Laptop opens a website
        </button>
        <button className="pw-btn-secondary px-3 py-1.5" onClick={() => run('phone')}>
          Phone opens a website
        </button>
        <button className="pw-btn-secondary px-3 py-1.5" onClick={() => run('reply')}>
          Website replies
        </button>
        <button className="pw-btn-secondary px-3 py-1.5" onClick={() => run('stranger')}>
          Stranger sends a packet
        </button>
        <button
          className="pw-btn-secondary px-3 py-1.5"
          onClick={() => {
            setTable([])
            setShot(null)
          }}
          aria-label="Reset"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-fg-muted">
        <input type="checkbox" checked={forward} onChange={(e) => setForward(e.target.checked)} className="accent-proto-tcp" />
        Port forward: send incoming port 8080 to the laptop
      </label>

      <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
        <Side title="Inside: your home network" subtitle="Private addresses (192.168.x.x)" addr={shot?.inside ?? null} />
        <div className="flex flex-col items-center justify-center rounded-md border-[1.5px] border-edge bg-card px-4 py-3 text-center">
          <div className="text-xs text-fg-faint">Router</div>
          <div className="font-mono text-xs text-fg-muted">192.168.1.1 | {WAN}</div>
          {shot && (
            <div
              className={cx(
                'mt-2 rounded-full border px-2 py-0.5 text-2xs',
                shot.verdict === 'dropped' ? 'border-proto-error/50 text-proto-error' : 'border-proto-http/50 text-proto-http',
              )}
            >
              {shot.verdict}
            </div>
          )}
        </div>
        <Side title="Outside: the internet" subtitle="Everyone sees one public address" addr={shot?.outside ?? null} />
      </div>

      <div aria-live="polite" className="min-h-[3rem] text-sm leading-relaxed text-fg-muted">
        {shot ? (
          <>
            <strong className="text-fg">{shot.title}.</strong> {shot.text}
          </>
        ) : (
          'Pick an action to send a packet through the router.'
        )}
      </div>

      <div className="overflow-x-auto rounded-md border-[1.5px] border-edge">
        <table className="w-full text-left text-xs">
          <thead className="bg-card text-fg-faint">
            <tr>
              <th className="px-3 py-2 font-normal">Inside address</th>
              <th className="px-3 py-2 font-normal">Public address</th>
              <th className="px-3 py-2 font-normal">Remote</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {table.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-2 font-sans text-fg-faint">
                  NAT table is empty.
                </td>
              </tr>
            )}
            {table.map((e) => (
              <tr key={e.inside} className="border-t border-rule">
                <td className="px-3 py-1.5">{e.inside}</td>
                <td className="px-3 py-1.5 text-proto-tcp">{e.outside}</td>
                <td className="px-3 py-1.5 text-fg-muted">{e.remote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Side({ title, subtitle, addr }: { title: string; subtitle: string; addr: { src: string; dst: string } | null }) {
  return (
    <div className="rounded-md border-[1.5px] border-edge bg-card p-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-2xs text-fg-faint">{subtitle}</div>
      <dl className="mt-3 space-y-1 font-mono text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-fg-faint">source</dt>
          <dd>{addr?.src ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-fg-faint">destination</dt>
          <dd>{addr?.dst ?? (addr === null ? '—' : '')}</dd>
        </div>
      </dl>
    </div>
  )
}

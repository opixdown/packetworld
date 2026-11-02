import { Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../../lib/cx'
import { Choice } from './Choice'

const SERVICES = [
  { id: 'https', label: 'A website (HTTPS)', transport: 'TCP', port: 443, note: 'Port 443 is the standard port for HTTPS.' },
  { id: 'http', label: 'A website (plain HTTP)', transport: 'TCP', port: 80, note: 'Port 80 is plain, unencrypted HTTP.' },
  { id: 'h3', label: 'A website over HTTP/3', transport: 'UDP', port: 443, note: 'HTTP/3 uses QUIC, which runs over UDP. Same port number, different transport.' },
  { id: 'dns', label: 'A DNS lookup', transport: 'UDP', port: 53, note: 'DNS normally uses UDP port 53 (and TCP 53 for large answers).' },
  { id: 'ssh', label: 'A remote terminal (SSH)', transport: 'TCP', port: 22, note: 'SSH listens on port 22 by default.' },
] as const

type ServiceId = (typeof SERVICES)[number]['id']

/** Example ephemeral ports, as an OS might hand them out. */
const EPHEMERAL = [52144, 52151, 52158, 52163, 52170]

/** Lesson 2: what IP addresses and ports each identify, and why a connection needs both. */
export function AddressLab() {
  const [service, setService] = useState<ServiceId>('https')
  const [tabs, setTabs] = useState<number[]>([52144])
  const s = SERVICES.find((x) => x.id === service)!
  const server = s.id === 'dns' ? '192.0.2.53' : '203.0.113.48'

  return (
    <div className="space-y-4">
      <Choice label="What is your computer talking to?" value={service} onChange={(v) => { setService(v); setTabs([52144]) }} options={SERVICES.map((x) => ({ value: x.id, label: x.label }))} />

      <div className="rounded-md border-[1.5px] border-edge bg-card p-4">
        <div className="grid items-center gap-3 font-mono text-sm md:grid-cols-[1fr_auto_1fr]">
          <Socket title="Your laptop" ip="192.168.1.23" port={String(tabs[0])} portNote="Picked at random by your OS (an “ephemeral” port)" />
          <div className="text-center text-xs text-fg-faint">
            <div className={cx('rounded-full border px-2 py-0.5', s.transport === 'TCP' ? 'border-proto-tcp/40 text-proto-tcp' : 'border-proto-udp/40 text-proto-udp')}>{s.transport}</div>
          </div>
          <Socket title={s.id === 'dns' ? 'DNS resolver' : 'Web server'} ip={server} port={String(s.port)} portNote={s.note} />
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-md border-[1.5px] border-edge p-4">
          <div className="font-mono text-xs text-proto-ip">IP address</div>
          <p className="mt-1 text-fg-muted">Which <strong className="text-fg">machine</strong>. Routers only look at this part to move the packet across the internet.</p>
        </div>
        <div className="rounded-md border-[1.5px] border-edge p-4">
          <div className="font-mono text-xs text-proto-tcp">Port</div>
          <p className="mt-1 text-fg-muted">Which <strong className="text-fg">program</strong> on that machine. The operating system uses it to hand the data to the right app.</p>
        </div>
      </div>

      {s.transport === 'TCP' && (
        <div className="rounded-md border-[1.5px] border-edge p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-fg-muted">Open more tabs to the same site. How does your laptop keep the connections apart?</p>
            <div className="flex gap-2">
              <button onClick={() => setTabs([...tabs, EPHEMERAL[tabs.length]])} disabled={tabs.length >= 5} className="pw-btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                <Plus size={13} /> Open another tab
              </button>
              <button onClick={() => setTabs([52144])} className="pw-btn-secondary px-3 py-1.5 text-xs" aria-label="Reset tabs">
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
          <table className="mt-3 w-full text-left font-mono text-xs">
            <thead className="text-fg-faint">
              <tr>
                <th className="py-1 font-normal">Protocol</th>
                <th className="py-1 font-normal">Your address : port</th>
                <th className="py-1 font-normal">Server address : port</th>
              </tr>
            </thead>
            <tbody>
              {tabs.map((p, i) => (
                <tr key={p} className="border-t border-rule">
                  <td className="py-1.5 text-proto-tcp">TCP</td>
                  <td className="py-1.5">
                    192.168.1.23:<span className={cx(i === tabs.length - 1 && tabs.length > 1 && 'text-proto-dns')}>{p}</span>
                  </td>
                  <td className="py-1.5">
                    {server}:{s.port}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-relaxed text-fg-faint">
            Every connection is identified by five things: protocol, source address, source port, destination address and destination port. Only your source port changes between tabs, and that is enough to keep them apart.
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-fg-faint">
        These are IPv4 addresses: four numbers from 0 to 255. IPv6 addresses are much longer, like <code className="text-fg-muted">2001:db8::30</code>, because the world ran out of IPv4 addresses. 192.168.x.x is a private range used only inside home networks.
      </p>
    </div>
  )
}

function Socket({ title, ip, port, portNote }: { title: string; ip: string; port: string; portNote: string }) {
  return (
    <div className="rounded-lg border border-rule bg-card p-3">
      <div className="font-sans text-xs text-fg-faint">{title}</div>
      <div className="mt-1 text-base">
        <span className="text-proto-ip">{ip}</span>
        <span className="text-fg-faint">:</span>
        <span className="text-proto-tcp">{port}</span>
      </div>
      <div className="mt-1 font-sans text-2xs leading-snug text-fg-faint">{portNote}</div>
    </div>
  )
}

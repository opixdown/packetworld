import { useMemo, useState } from 'react'
import { formatMs } from '../../sim/builder'
import { buildJourney } from '../../sim/journey'
import { summarize } from '../../sim/timing'
import { Waterfall } from '../Waterfall'

// Lesson 10: how latency and loss turn into waiting time.

const STACKS = [
  { name: 'HTTP/1.1 or HTTP/2 · TLS 1.2 · TCP', setup: 3, note: 'TCP 1 RTT + TLS 2 RTT' },
  { name: 'HTTP/1.1 or HTTP/2 · TLS 1.3 · TCP', setup: 2, note: 'TCP 1 RTT + TLS 1 RTT (this site’s simulation)' },
  { name: 'HTTP/3 · QUIC · UDP', setup: 1, note: 'Transport and encryption set up together' },
  { name: 'HTTP/3 with 0-RTT resumption', setup: 0, note: 'Returning visitor sends the request immediately' },
]

export function LatencyLab() {
  const [latency, setLatency] = useState(40)
  const [loss, setLoss] = useState(0)
  const [seed, setSeed] = useState(1)
  const summary = useMemo(() => summarize(buildJourney({ latencyMs: latency, lossPercent: loss, seed, dnsCache: 'resolver-cached' })), [latency, loss, seed])
  const rtt = 2 * latency
  const maxStack = (STACKS[0].setup + 1) * rtt

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-fg-muted">
          <span className="flex justify-between">
            One-way latency <span className="font-mono text-fg">{latency} ms</span>
          </span>
          <input type="range" min={5} max={300} step={5} value={latency} onChange={(e) => setLatency(Number(e.target.value))} className="pw-range mt-2 w-full" />
          <span className="mt-1 block text-2xs text-fg-faint">Round-trip time (RTT) = {rtt} ms. Same city ≈ 5 ms, across an ocean ≈ 40–80 ms, satellite (geostationary) ≈ 300 ms.</span>
        </label>
        <label className="block text-sm text-fg-muted">
          <span className="flex justify-between">
            Packet loss <span className="font-mono text-fg">{loss}%</span>
          </span>
          <input type="range" min={0} max={30} step={1} value={loss} onChange={(e) => setLoss(Number(e.target.value))} className="pw-range mt-2 w-full" />
          {loss > 0 && (
            <button onClick={() => setSeed(seed + 1)} className="mt-1 text-2xs text-fg-faint underline hover:text-fg">
              try different unlucky packets
            </button>
          )}
        </label>
      </div>

      <div className="rounded-md border-[1.5px] border-edge bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Loading example.com (simulated)</h3>
          <span className="font-mono text-xs text-fg-muted">
            {summary.retransmissions > 0 ? `${summary.retransmissions} retransmission${summary.retransmissions > 1 ? 's' : ''}` : 'no retransmissions'}
          </span>
        </div>
        <Waterfall summary={summary} />
      </div>

      <div className="rounded-md border-[1.5px] border-edge bg-card p-4">
        <h3 className="text-sm font-semibold">Time to first byte by protocol stack (estimate, DNS excluded)</h3>
        <p className="mt-1 text-xs text-fg-faint">Setup round trips + 1 round trip for the request, at the RTT above. Server time ignored.</p>
        <div className="mt-3 space-y-2">
          {STACKS.map((s) => {
            const ms = (s.setup + 1) * rtt
            return (
              <div key={s.name} className="grid items-center gap-x-3 gap-y-1 text-xs sm:grid-cols-[16rem_minmax(0,1fr)_4.5rem]">
                <span className="text-fg-muted">
                  {s.name}
                  <span className="block text-2xs text-fg-faint">{s.note}</span>
                </span>
                <div className="h-3 rounded-sm bg-wash">
                  <div className="h-full rounded-sm bg-proto-tcp/70 transition-all duration-300" style={{ width: `${(ms / maxStack) * 100}%` }} />
                </div>
                <span className="text-right font-mono tabular-nums">{formatMs(ms)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

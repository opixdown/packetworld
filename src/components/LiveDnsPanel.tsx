import { Globe2, Loader2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RESOLVERS, lookup, type DohResult } from '../live/doh'
import { cx } from '../lib/cx'
import type { Target } from '../sim/types'
import { TermText } from './TermText'

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'done'; a: DohResult; aaaa: DohResult | null } | { kind: 'error'; message: string }

/**
 * "Look it up for real": the one feature that sends a real request. It asks a
 * public DNS-over-HTTPS resolver for the real addresses of the host and shows
 * them next to the simulated ones. Nothing is sent until the learner clicks.
 */
export function LiveDnsPanel({ target }: { target: Target }) {
  const [resolver, setResolver] = useState<(typeof RESOLVERS)[number]['id']>('cloudflare')
  const [state, setState] = useState<State>({ kind: 'idle' })

  useEffect(() => {
    setState({ kind: 'idle' })
  }, [target.host])

  if (target.isIpLiteral) return null

  const run = async () => {
    setState({ kind: 'loading' })
    try {
      const [a, aaaa] = await Promise.all([lookup(target.host, 'A', resolver), lookup(target.host, 'AAAA', resolver).catch(() => null)])
      setState({ kind: 'done', a, aaaa })
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'The lookup failed.' })
    }
  }

  const resolverLabel = RESOLVERS.find((r) => r.id === resolver)!.label

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-fg-muted">
          Ask a real DNS resolver for the real address of <span className="font-mono text-fg">{target.host}</span>, and compare it with the pretend one
          the simulation used.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="resolver">
            Resolver
          </label>
          <select id="resolver" className="pw-select py-2 text-sm" value={resolver} onChange={(e) => setResolver(e.target.value as typeof resolver)}>
            {RESOLVERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <button onClick={run} disabled={state.kind === 'loading'} className="pw-btn-primary py-2">
            {state.kind === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Globe2 size={16} />} Look it up for real
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-fg-faint">
        Sends one encrypted DNS-over-HTTPS request from your browser to {resolverLabel}, which will see the name you look up. Nothing else leaves your computer.
      </p>

      {state.kind === 'error' && (
        <p role="alert" className="mt-3 rounded border-[1.5px] border-proto-error bg-tint-error px-3 py-2 text-sm text-fg">
          {state.message} You may be offline, or a network filter may block DNS-over-HTTPS.
        </p>
      )}

      {state.kind === 'done' && <Result a={state.a} aaaa={state.aaaa} simulatedIp={target.serverIp} />}
    </div>
  )
}

function Result({ a, aaaa, simulatedIp }: { a: DohResult; aaaa: DohResult | null; simulatedIp: string }) {
  const ipv4 = a.answers.filter((r) => r.type === 'A')
  const ipv6 = aaaa?.answers.filter((r) => r.type === 'AAAA') ?? []
  const chain = a.answers.filter((r) => r.type === 'CNAME')
  const ok = a.status === 'NOERROR' && ipv4.length + ipv6.length > 0
  return (
    <div className="mt-4 grid animate-fade-up gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="rounded border-[1.5px] border-edge bg-paper/60 p-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={cx('rounded border-[1.5px] px-2 py-0.5 font-mono text-xs font-semibold', ok ? 'border-proto-http bg-tint-http text-proto-http' : 'border-proto-error bg-tint-error text-proto-error')}>
            {a.status}
          </span>
          <span className="font-mono text-xs text-fg-muted">answered in {a.ms} ms</span>
          {a.dnssec && (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-proto-tls">
              <ShieldCheck size={13} /> DNSSEC verified
            </span>
          )}
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          {chain.map((c) => (
            <Row key={c.name + c.data} label="Alias (CNAME)" value={`${c.name} → ${c.data}`} ttl={c.ttl} />
          ))}
          {ipv4.map((r) => (
            <Row key={r.data} label="IPv4 (A)" value={r.data} ttl={r.ttl} />
          ))}
          {ipv6.map((r) => (
            <Row key={r.data} label="IPv6 (AAAA)" value={r.data} ttl={r.ttl} />
          ))}
          {!ok && <p className="text-fg-muted">No address came back. {a.status === 'NXDOMAIN' ? 'This name does not exist.' : ''}</p>}
        </dl>
      </div>
      <div className="text-sm leading-relaxed text-fg">
        <h3 className="text-base font-semibold">What this tells you</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-fg-muted">
          {ok && (
            <li>
              <TermText text={`The real address is ${ipv4[0]?.data ?? ipv6[0]?.data}. The simulation used ${simulatedIp}, a pretend address from a range reserved for examples.`} />
            </li>
          )}
          {ipv4[0] && (
            <li>
              <TermText text={`TTL ${ipv4[0].ttl} means caches may keep this answer for ${ipv4[0].ttl} more seconds before asking again.`} />
            </li>
          )}
          {ipv6.length > 0 && <li>This site also has IPv6 addresses. Modern browsers try both and use whichever connects first.</li>}
          {chain.length > 0 && <li>The name is an alias: DNS first points it to another name, then to an address. Big sites do this to use content delivery networks.</li>}
          {ipv4.length > 1 && <li>More than one address came back. Big sites spread visitors across several servers.</li>}
          <li>
            <TermText text={`${a.ms} ms is the whole HTTPS round trip to the resolver, so it includes the network delay to it.`} />
          </li>
        </ul>
      </div>
    </div>
  )
}

function Row({ label, value, ttl }: { label: string; value: string; ttl: number }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="min-w-0 break-all font-mono text-fg">
        {value} <span className="text-xs text-fg-faint">TTL {ttl}s</span>
      </dd>
    </div>
  )
}

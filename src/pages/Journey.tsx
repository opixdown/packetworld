import { ArrowRight, Info, Play } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { JourneyPlayer } from '../components/JourneyPlayer'
import { RealWorldPanel } from '../components/RealWorldPanel'
import { DNS_CACHE_OPTIONS, type DnsCacheMode } from '../sim/config'
import { buildJourney } from '../sim/journey'
import { TargetError } from '../sim/target'

const EXAMPLES = ['https://example.com', 'https://www.example.org/docs', 'http://example.net']

export function JourneyPage() {
  const [params, setParams] = useSearchParams()
  const url = params.get('url') ?? 'https://example.com'
  const dnsCache = (params.get('dns') as DnsCacheMode) ?? 'cold'
  const [draft, setDraft] = useState(url)
  const [runId, setRunId] = useState(0)

  const result = useMemo(() => {
    try {
      return { journey: buildJourney({ url, dnsCache }), error: null }
    } catch (e) {
      if (e instanceof TargetError) return { journey: buildJourney({ dnsCache }), error: e.message }
      throw e
    }
  }, [url, dnsCache])

  const start = (next = draft, dns = dnsCache) => {
    setParams({ url: next, dns }, { replace: true })
    setDraft(next)
    setRunId((n) => n + 1)
  }

  const cacheHint = DNS_CACHE_OPTIONS.find((o) => o.value === dnsCache)?.hint

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">What happens when you open a website?</h1>
        <p className="max-w-3xl text-fg-muted">
          Type an address and watch every packet: finding the server (DNS), opening a connection (TCP), making it private (TLS) and asking for the
          page (HTTP). Click any machine or packet to look inside.
        </p>
      </div>

      <form
        className="mb-4 flex flex-col gap-2 rounded-md border-[1.5px] border-edge bg-card p-3 lg:flex-row lg:items-center"
        onSubmit={(e) => {
          e.preventDefault()
          start()
        }}
      >
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="sr-only">Website address</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="pw-input w-full font-mono"
            placeholder="https://example.com"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          <span className="whitespace-nowrap">DNS cache</span>
          <select className="pw-select min-w-0 flex-1" value={dnsCache} onChange={(e) => start(draft, e.target.value as DnsCacheMode)}>
            {DNS_CACHE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="pw-btn-primary">
          <Play size={15} fill="currentColor" /> Start Journey
        </button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => start(ex)} className="rounded-full border border-rule px-2.5 py-1 font-mono text-fg-muted hover:border-rule-strong hover:text-fg">
            {ex.replace(/^https?:\/\//, (m) => (m === 'http://' ? 'http://' : ''))}
          </button>
        ))}
              <a href="#real" onClick={(e) => { e.preventDefault(); document.getElementById('real')?.scrollIntoView({ behavior: 'smooth' }) }} className="ml-auto font-bold text-fg underline decoration-proto-tcp decoration-2 underline-offset-4">
          Try it for real ↓
        </a>
      </div>

      {result.error && (
        <p role="alert" className="mb-4 rounded-lg border border-proto-error/40 bg-proto-error/10 px-3 py-2 text-sm text-proto-error">
          {result.error} Showing example.com instead.
        </p>
      )}

      {cacheHint && (
        <p className="mb-4 flex items-start gap-2 text-xs leading-relaxed text-fg-muted">
          <Info size={14} className="mt-0.5 shrink-0 text-proto-dns" />
          <span>
            <strong className="font-semibold text-fg">{DNS_CACHE_OPTIONS.find((o) => o.value === dnsCache)!.label}.</strong> {cacheHint}
          </span>
        </p>
      )}

      <JourneyPlayer key={`${url}|${dnsCache}|${runId}`} journey={result.journey} autoplay={runId > 0} keyboard />

      <div id="real" className="mt-6 scroll-mt-20">
        <RealWorldPanel target={result.journey.target} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <NextLink to="/learn/tcp-handshake" title="TCP handshake lab" text="Slow down the three-way handshake and break it on purpose." />
        <NextLink to="/learn/tls-https" title="TLS and HTTPS" text="Certificates, keys, and what encryption does and doesn’t hide." />
        <NextLink to="/playground" title="Playground" text="Add latency and packet loss, fail DNS, return a 404." />
      </div>
    </div>
  )
}

function NextLink({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <Link to={to} className="group rounded-md border-[1.5px] border-edge p-4 transition-colors hover:border-rule-strong">
      <div className="flex items-center justify-between font-semibold">
        {title}
        <ArrowRight size={15} className="text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
      </div>
      <p className="mt-1 text-sm text-fg-muted">{text}</p>
    </Link>
  )
}

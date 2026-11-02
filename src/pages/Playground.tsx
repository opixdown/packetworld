import { Check, Dices, Link2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { JourneyPlayer } from '../components/JourneyPlayer'
import { Waterfall } from '../components/Waterfall'
import { EXPERIMENTS, configFromParams, paramsFromConfig } from '../content/experiments'
import { cx } from '../lib/cx'
import { formatMs } from '../sim/builder'
import { DEFAULT_CONFIG, DNS_CACHE_OPTIONS, SCENARIO_OPTIONS, type DnsCacheMode, type JourneyConfig, type Scenario } from '../sim/config'
import { buildJourney } from '../sim/journey'
import { summarize } from '../sim/timing'
import type { Outcome } from '../sim/types'

const OUTCOME: Record<Outcome, { label: string; className: string }> = {
  success: { label: 'Page loaded', className: 'text-proto-http border-proto-http bg-tint-http' },
  'http-error': { label: 'Connected, but the page is missing', className: 'text-proto-warn border-proto-warn bg-tint-warn' },
  'dns-failed': { label: 'Name not found (DNS failed)', className: 'text-proto-error border-proto-error bg-tint-error' },
  timeout: { label: 'Gave up waiting (timeout)', className: 'text-proto-error border-proto-error bg-tint-error' },
  'cert-failed': { label: 'Certificate rejected', className: 'text-proto-error border-proto-error bg-tint-error' },
}

export function PlaygroundPage() {
  const [params, setParams] = useSearchParams()
  const config = useMemo(() => configFromParams(params), [params])
  const experiment = EXPERIMENTS.find((e) => e.id === params.get('exp'))
  const [copied, setCopied] = useState(false)

  const update = (patch: Partial<JourneyConfig>, exp: string | null = null) => {
    setParams(paramsFromConfig({ ...config, ...patch }, exp), { replace: true })
  }

  const journey = useMemo(() => buildJourney(config), [config])
  const summary = useMemo(() => summarize(journey), [journey])
  const baseline = useMemo(() => summarize(buildJourney({ url: config.url })), [config.url])
  const delta = summary.total - baseline.total

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard can be blocked; the address bar already holds the link.
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Playground</h1>
          <p className="mt-1 max-w-2xl text-fg-muted">Break the network on purpose. Pick a question, press Start, and watch what changes.</p>
        </div>
        <button onClick={share} className="pw-btn-secondary self-start sm:self-auto">
          {copied ? <Check size={15} /> : <Link2 size={15} />} {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>

      {/* 1. Pick an experiment */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <div role="radiogroup" aria-label="Experiments" className="flex gap-2 sm:flex-wrap">
          {EXPERIMENTS.map((e) => (
            <button
              key={e.id}
              role="radio"
              aria-checked={experiment?.id === e.id}
              title={e.question}
              onClick={() => setParams(paramsFromConfig({ ...DEFAULT_CONFIG, ...e.config }, e.id), { replace: true })}
              className={cx(
                'shrink-0 whitespace-nowrap rounded-md border-[1.5px] border-edge px-3 py-2 text-sm font-bold transition-colors',
                experiment?.id === e.id ? 'bg-fg text-card' : 'bg-card text-fg hover:bg-tint-marker',
              )}
            >
              {e.short}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Dials and the result, side by side */}
      <div className="mt-4 grid gap-4 rounded-md border-[1.5px] border-edge bg-card p-4 shadow-note lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          {experiment ? (
            <p className="mb-4 border-l-4 border-tint-marker pl-3 text-[0.95rem] leading-relaxed">
              <span className="font-display font-semibold">{experiment.question}</span> <span className="text-fg-muted">{experiment.notice}</span>
            </p>
          ) : (
            <p className="mb-4 text-sm text-fg-muted">Turn the dials, or pick a question above.</p>
          )}
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <Slider label="Latency (one way)" value={config.latencyMs} min={5} max={400} step={5} unit="ms" onChange={(v) => update({ latencyMs: v })} />
            <Slider label="Packet loss" value={config.lossPercent} min={0} max={30} step={1} unit="%" onChange={(v) => update({ lossPercent: v })} />
            <Slider label="Server thinking time" value={config.serverTimeMs} min={0} max={1500} step={10} unit="ms" onChange={(v) => update({ serverTimeMs: v })} />
            <label className="block text-sm font-bold text-fg">
              DNS cache
              <select className="pw-select mt-1 w-full font-normal" value={config.dnsCache} onChange={(e) => update({ dnsCache: e.target.value as DnsCacheMode })}>
                {DNS_CACHE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-fg">
              What goes wrong
              <select className="pw-select mt-1 w-full font-normal" value={config.scenario} onChange={(e) => update({ scenario: e.target.value as Scenario })}>
                {SCENARIO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {config.lossPercent > 0 && (
              <button onClick={() => update({ seed: config.seed + 1 })} className="inline-flex items-center gap-1.5 self-end text-sm font-bold text-fg underline decoration-2 underline-offset-4">
                <Dices size={16} /> Try different unlucky packets
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2 border-t border-rule pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <div className="font-display text-base font-semibold">Result</div>
          <span className={cx('inline-block rounded border-[1.5px] px-2 py-0.5 text-sm font-bold', OUTCOME[journey.outcome].className)}>{OUTCOME[journey.outcome].label}</span>
          <Stat label="Total time" value={formatMs(summary.total)} />
          <Stat label="vs. normal settings" value={`${delta >= 0 ? '+' : '−'}${formatMs(Math.abs(delta))}`} />
          <Stat label="Packets sent" value={String(summary.packets)} />
          <Stat label="Lost or unanswered" value={String(summary.lost)} />
          <Stat label="Sent again" value={String(summary.retransmissions)} />
        </div>
      </div>

      {/* 3. The simulation itself */}
      <div className="mt-6">
        <JourneyPlayer key={params.toString()} journey={journey} keyboard />
      </div>

      {/* 4. Where the time went */}
      <div className="mt-6 rounded-md border-[1.5px] border-edge bg-card p-4">
        <h2 className="text-xl font-semibold">Where did the time go?</h2>
        <p className="mb-4 mt-1 text-sm text-fg-muted">Each bar is one stage of loading the page, in simulated time.</p>
        <Waterfall summary={summary} scale={Math.max(summary.total, baseline.total)} />
        {journey.notes.map((n) => (
          <p key={n} className="mt-3 text-xs text-fg-faint">
            {n}
          </p>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="font-mono tabular-nums text-fg">{value}</span>
    </div>
  )
}

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm font-bold text-fg">
      <span className="flex justify-between">
        {label}
        <span className="font-mono font-normal text-fg">
          {value}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="pw-range mt-2 w-full" />
    </label>
  )
}

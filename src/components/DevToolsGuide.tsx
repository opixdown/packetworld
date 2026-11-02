import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../lib/cx'
import { PROTOCOL_CLASSES } from '../lib/protocols'
import type { Protocol, Target } from '../sim/types'
import { TermText } from './TermText'

// A website can't read your real network traffic, but your own browser can
// show it. This guide maps the real DevTools columns to PacketWorld's stages.

const BROWSERS = {
  chrome: { label: 'Chrome / Edge', open: 'Press F12 (Windows) or ⌥ Option + ⌘ Cmd + I (Mac).' },
  safari: {
    label: 'Safari',
    open: 'First turn on Safari → Settings → Advanced → “Show features for web developers”. Then press ⌥ Option + ⌘ Cmd + I.',
  },
  firefox: { label: 'Firefox', open: 'Press F12 (Windows) or ⌥ Option + ⌘ Cmd + I (Mac).' },
} as const

type BrowserId = keyof typeof BROWSERS

const TIMING: { column: string; proto: Protocol; stage: string; note: string }[] = [
  { column: 'DNS Lookup', proto: 'dns', stage: 'Stage 1 · DNS', note: 'Finding the IP address. Often 0 ms, because the answer was cached.' },
  { column: 'Initial connection', proto: 'tcp', stage: 'Stage 2 · TCP', note: 'The SYN, SYN-ACK, ACK handshake (Chrome includes the TLS time in this bar too).' },
  { column: 'SSL', proto: 'tls', stage: 'Stage 3 · TLS', note: 'Client Hello, Server Hello, the certificate check and the keys.' },
  { column: 'Request sent', proto: 'http', stage: 'Stage 4 · HTTP', note: 'The GET request leaving your computer.' },
  { column: 'Waiting for server response', proto: 'http', stage: 'Stage 4 · HTTP', note: 'The round trip plus the server’s thinking time. Also called TTFB (time to first byte).' },
  { column: 'Content Download', proto: 'http', stage: 'Stage 4 · HTTP', note: 'The page’s bytes arriving.' },
]

export function DevToolsGuide({ target }: { target: Target }) {
  const [browser, setBrowser] = useState<BrowserId>('chrome')
  const steps = [
    <>
      Open the real site in a new tab:{' '}
      <a href={target.url} target="_blank" rel="noopener noreferrer" className="pw-link inline-flex items-center gap-1">
        {target.host} <ExternalLink size={13} />
      </a>
    </>,
    <>Open the developer tools. {BROWSERS[browser].open}</>,
    <>
      Click the <strong>Network</strong> tab. Tick <strong>Disable cache</strong>, then reload the page (⌘R or Ctrl+R). Every request the page makes
      appears as a row.
    </>,
    <>
      Click the first row (the page itself), then open its <strong>Timing</strong> tab. These bars are the same stages you just watched:
    </>,
  ]
  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">
        <TermText text="A website isn't allowed to see your real network traffic. But your own browser can show you every request it makes, with real timings and headers. This is exactly what web developers use." />
      </p>
      <div role="radiogroup" aria-label="Your browser" className="flex flex-wrap gap-2">
        {(Object.keys(BROWSERS) as BrowserId[]).map((id) => (
          <button
            key={id}
            role="radio"
            aria-checked={browser === id}
            onClick={() => setBrowser(id)}
            className={cx('rounded-md border-[1.5px] border-edge px-3 py-1.5 text-sm font-bold', browser === id ? 'bg-fg text-card' : 'bg-card hover:bg-tint-marker')}
          >
            {BROWSERS[id].label}
          </button>
        ))}
      </div>
      <ol className="space-y-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-edge bg-card font-display font-semibold">{i + 1}</span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-fg-faint">Column names below are Chrome’s. Safari and Firefox show the same phases with slightly different names.</p>
      <div className="overflow-x-auto rounded-md border-[1.5px] border-edge">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-wash">
            <tr>
              <th className="px-3 py-2 font-bold">In DevTools</th>
              <th className="px-3 py-2 font-bold">In PacketWorld</th>
              <th className="px-3 py-2 font-bold">What it is</th>
            </tr>
          </thead>
          <tbody>
            {TIMING.map((r) => (
              <tr key={r.column} className="border-t border-rule bg-card">
                <td className="px-3 py-2 font-mono text-xs">{r.column}</td>
                <td className="px-3 py-2">
                  <span className={cx('rounded border-[1.5px] px-1.5 py-0.5 font-mono text-xs font-semibold', PROTOCOL_CLASSES[r.proto].border, PROTOCOL_CLASSES[r.proto].text, PROTOCOL_CLASSES[r.proto].tint)}>{r.stage}</span>
                </td>
                <td className="px-3 py-2 text-fg-muted">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
        <li>
          <strong className="text-fg">Headers tab:</strong> the real request and response, with the same fields as PacketWorld’s inspector: the method,{' '}
          <span className="font-mono">Host</span>, the status code (200), <span className="font-mono">Content-Type</span>.
        </li>
        <li>
          <strong className="text-fg">Security / Privacy panel</strong> (Chrome): the real TLS version, key exchange and certificate.
        </li>
        <li>
          <strong className="text-fg">Want the actual packets?</strong> Free tools like Wireshark record every packet on your computer. They need installing and admin rights, which is why
          no website can do it.
        </li>
      </ul>
    </div>
  )
}

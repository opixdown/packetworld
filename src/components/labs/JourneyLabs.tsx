import { useMemo, useState } from 'react'
import { DNS_CACHE_OPTIONS, type DnsCacheMode } from '../../sim/config'
import { buildJourney, sliceJourney } from '../../sim/journey'
import type { NodeId } from '../../sim/types'
import { JourneyPlayer } from '../JourneyPlayer'
import { SequencePlayer } from '../SequencePlayer'
import { Choice } from './Choice'

const DNS_NODES: NodeId[] = ['client', 'router', 'resolver', 'root', 'tld', 'auth']

/** Lesson 1: the whole journey, with the most common DNS situation. */
export function OverviewLab() {
  const journey = useMemo(() => buildJourney({ dnsCache: 'tld-cached' }), [])
  return <JourneyPlayer journey={journey} compact />
}

/** Lesson 3: DNS with every cache level. */
export function DnsLab() {
  const [cache, setCache] = useState<DnsCacheMode>('cold')
  const journey = useMemo(() => sliceJourney(buildJourney({ dnsCache: cache }), ['dns']), [cache])
  return (
    <div className="space-y-3">
      <Choice label="DNS cache" value={cache} onChange={setCache} options={DNS_CACHE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
      <p className="text-sm text-fg-muted">{DNS_CACHE_OPTIONS.find((o) => o.value === cache)!.hint}</p>
      <JourneyPlayer key={cache} journey={journey} compact nodes={DNS_NODES} />
    </div>
  )
}

type Break = 'normal' | 'syn-lost' | 'synack-lost' | 'ack-lost' | 'server-timeout'

const BREAKS: { value: Break; label: string; text: string }[] = [
  { value: 'normal', label: 'Normal handshake', text: 'Three packets, one and a half round trips. The client may send data as soon as it has sent the ACK.' },
  {
    value: 'syn-lost',
    label: 'Lose the SYN',
    text: 'The server never hears anything. The client waits for its retransmission timer (1 s) and sends the identical SYN again. Same sequence number: it is the same request.',
  },
  {
    value: 'synack-lost',
    label: 'Lose the SYN-ACK',
    text: 'The server answered, but the reply vanished. From the client’s side this looks exactly like a lost SYN, so it retransmits the SYN and the server answers again.',
  },
  {
    value: 'ack-lost',
    label: 'Lose the final ACK',
    text: 'The client thinks the connection is open; the server is still waiting. No retransmission is needed: the client’s first data packet also carries ACK=5001, which completes the handshake.',
  },
  {
    value: 'server-timeout',
    label: 'Server doesn’t respond',
    text: 'Nothing comes back at all. The client retries with exponential backoff (1 s, 2 s, 4 s…) and eventually gives up with a timeout error.',
  },
]

/** Lesson 5: the TCP handshake as a sequence diagram, with Break the Handshake. */
export function HandshakeLab() {
  const [mode, setMode] = useState<Break>('normal')
  const journey = useMemo(() => {
    const full = buildJourney({ scenario: mode, dnsCache: 'os-cached' })
    // Show the first TLS packet too when the ACK is lost: that is where the handshake completes.
    const sliced = sliceJourney(full, mode === 'ack-lost' ? ['tcp', 'tls'] : ['tcp'])
    if (mode !== 'ack-lost') return sliced
    const hello = sliced.events.findIndex((e) => e.packet?.label === 'Client Hello')
    return { ...sliced, events: sliced.events.slice(0, hello + 1) }
  }, [mode])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-proto-error">Break the handshake</span>
        <Choice label="Handshake scenario" value={mode} onChange={setMode} options={BREAKS.map((b) => ({ value: b.value, label: b.label }))} />
      </div>
      <p className="text-sm leading-relaxed text-fg-muted">{BREAKS.find((b) => b.value === mode)!.text}</p>
      <SequencePlayer key={mode} journey={journey} columns={['client', 'server']} showTcpState />
    </div>
  )
}

type TlsMode = 'valid' | 'expired' | 'plain'

/** Lesson 6: the TLS 1.3 handshake, an expired certificate, and plain HTTP for contrast. */
export function TlsLab() {
  const [mode, setMode] = useState<TlsMode>('valid')
  const journey = useMemo(() => {
    if (mode === 'plain') return sliceJourney(buildJourney({ url: 'http://example.com', dnsCache: 'os-cached' }), ['tls', 'http'])
    return sliceJourney(buildJourney({ scenario: mode === 'expired' ? 'tls-invalid-cert' : 'normal', dnsCache: 'os-cached' }), ['tls'])
  }, [mode])
  return (
    <div className="space-y-3">
      <Choice
        label="TLS scenario"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'valid', label: 'HTTPS, valid certificate' },
          { value: 'expired', label: 'Expired certificate' },
          { value: 'plain', label: 'Plain http:// (no TLS)' },
        ]}
      />
      <SequencePlayer key={mode} journey={journey} columns={['client', 'server']} />
    </div>
  )
}

/** Lesson 7: HTTP request and response over the established connection. */
export function HttpLab() {
  const [status, setStatus] = useState<'200' | '404'>('200')
  const journey = useMemo(
    () => sliceJourney(buildJourney(status === '404' ? { scenario: 'http-404', url: 'https://example.com/missing-page', dnsCache: 'os-cached' } : { dnsCache: 'os-cached' }), ['http']),
    [status],
  )
  return (
    <div className="space-y-3">
      <Choice label="Response" value={status} onChange={setStatus} options={[{ value: '200', label: 'Page exists (200)' }, { value: '404', label: 'Page missing (404)' }]} />
      <SequencePlayer key={status} journey={journey} columns={['client', 'server']} />
    </div>
  )
}

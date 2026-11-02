// Configuration for building a journey. Every journey is a pure function of its
// config, so the same settings always produce the same packets.

export type DnsCacheMode = 'cold' | 'tld-cached' | 'resolver-cached' | 'os-cached' | 'browser-cached'

export type Scenario =
  | 'normal'
  | 'dns-nxdomain'
  | 'syn-lost'
  | 'synack-lost'
  | 'ack-lost'
  | 'server-timeout'
  | 'tls-invalid-cert'
  | 'http-404'

export interface JourneyConfig {
  url: string
  dnsCache: DnsCacheMode
  scenario: Scenario
  /** One-way latency between the client and the web server, in ms. */
  latencyMs: number
  /** Chance (0–100) that any single packet is lost. Deterministic per seed. */
  lossPercent: number
  /** Time the server spends building a response, in ms. */
  serverTimeMs: number
  /** Changes which packets random loss hits, without changing anything else. */
  seed: number
}

export const DEFAULT_CONFIG: JourneyConfig = {
  url: 'https://example.com',
  dnsCache: 'cold',
  scenario: 'normal',
  latencyMs: 30,
  lossPercent: 0,
  serverTimeMs: 20,
  seed: 1,
}

export const DNS_CACHE_OPTIONS: { value: DnsCacheMode; label: string; hint: string }[] = [
  {
    value: 'cold',
    label: 'Nothing cached (full lookup)',
    hint: 'The worst case: the resolver has to ask root, TLD and authoritative servers. Rare in practice.',
  },
  {
    value: 'tld-cached',
    label: 'Resolver knows the TLD servers',
    hint: 'The usual case for a new domain: the resolver already cached the .com servers, so it skips the root.',
  },
  {
    value: 'resolver-cached',
    label: 'Resolver has the answer cached',
    hint: 'Someone else using the same resolver visited recently. One round trip to the resolver.',
  },
  {
    value: 'os-cached',
    label: 'Operating system cache hit',
    hint: 'Another app on this computer looked the name up recently. No network traffic at all.',
  },
  {
    value: 'browser-cached',
    label: 'Browser cache hit',
    hint: 'The browser looked this name up moments ago. Fastest possible.',
  },
]

export const SCENARIO_OPTIONS: { value: Scenario; label: string; hint: string }[] = [
  { value: 'normal', label: 'Everything works', hint: 'The happy path.' },
  { value: 'dns-nxdomain', label: 'Domain does not exist', hint: 'DNS answers NXDOMAIN, so the browser never connects.' },
  { value: 'syn-lost', label: 'SYN is lost', hint: 'The first TCP packet disappears; the client retransmits after a timeout.' },
  { value: 'synack-lost', label: 'SYN-ACK is lost', hint: 'The server’s reply disappears; the client retransmits its SYN.' },
  { value: 'ack-lost', label: 'Final ACK is lost', hint: 'The handshake still completes, thanks to the next data packet.' },
  { value: 'server-timeout', label: 'Server does not respond', hint: 'SYNs go unanswered until the client gives up.' },
  { value: 'tls-invalid-cert', label: 'Certificate is invalid', hint: 'The certificate has expired, so the browser refuses to continue.' },
  { value: 'http-404', label: 'Page not found (404)', hint: 'Everything connects, but the server has no such page.' },
]

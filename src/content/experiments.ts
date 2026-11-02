import { DEFAULT_CONFIG, DNS_CACHE_OPTIONS, SCENARIO_OPTIONS, type JourneyConfig } from '../sim/config'

// Playground presets. Each one is a question plus the config that answers it.

export interface Experiment {
  id: string
  /** Chip label. */
  short: string
  question: string
  notice: string
  config: Partial<JourneyConfig>
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'dns-cache',
    short: 'DNS cache on',
    question: 'What happens when DNS caching is enabled?',
    notice:
      'The resolver already has the answer, so the whole root → TLD → authoritative walk disappears: one quick round trip instead of four. Try “Operating system cache hit” to remove DNS traffic entirely. This is what most lookups look like in real life.',
    config: { dnsCache: 'resolver-cached' },
  },
  {
    id: 'dns-fail',
    short: 'DNS fails',
    question: 'What happens when DNS lookup fails?',
    notice:
      'The .com server says the name doesn’t exist (NXDOMAIN). Without an IP address there is nothing to connect to, so no TCP, TLS or HTTP packet is ever sent.',
    config: { scenario: 'dns-nxdomain' },
  },
  {
    id: 'syn-lost',
    short: 'SYN lost',
    question: 'What happens when a TCP SYN packet is lost?',
    notice:
      'Nobody tells the client its SYN vanished. It waits for its retransmission timer (1 second) and sends the same SYN again. One lost packet costs a full second: watch the total time.',
    config: { scenario: 'syn-lost', dnsCache: 'os-cached' },
  },
  {
    id: 'server-timeout',
    short: 'Server silent',
    question: 'What happens when a server does not respond?',
    notice:
      'The client retries with exponential backoff (1 s, 2 s, 4 s, …) and gives up after about two minutes on Linux. That is why a dead server feels so much slower than a missing page.',
    config: { scenario: 'server-timeout', dnsCache: 'os-cached' },
  },
  {
    id: 'bad-cert',
    short: 'Bad certificate',
    question: 'What happens when a TLS certificate is invalid?',
    notice:
      'TCP connects fine and the server answers, but its certificate has expired. The browser stops before sending any request, so no cookies or data reach a server it can’t trust.',
    config: { scenario: 'tls-invalid-cert', dnsCache: 'os-cached' },
  },
  {
    id: 'http-404',
    short: 'Page not found',
    question: 'What happens when the server returns HTTP 404?',
    notice:
      'Every network step succeeds. 404 is the server saying “I understood you, but that page doesn’t exist.” It is an application answer, not a network failure.',
    config: { scenario: 'http-404', url: 'https://example.com/missing-page', dnsCache: 'os-cached' },
  },
  {
    id: 'latency',
    short: 'Slow network',
    question: 'What happens when latency increases?',
    notice:
      'Each extra millisecond of one-way delay is paid on every round trip: TCP (1), TLS (1), the HTML (1), the CSS (1). With 200 ms one way that is 1.6 seconds of waiting before the page shows, no matter how fast the server is.',
    config: { latencyMs: 200, dnsCache: 'os-cached' },
  },
  {
    id: 'loss',
    short: 'Packet loss',
    question: 'What happens when packet loss increases?',
    notice:
      'Lost packets are found by timeouts and resent. A few percent of loss can add whole seconds, because each recovery waits for a timer. Use “Roll the dice” to see different unlucky packets.',
    config: { lossPercent: 15, dnsCache: 'os-cached', seed: 3 },
  },
]

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const num = (v: string | null, fallback: number) => (v === null || Number.isNaN(Number(v)) ? fallback : Number(v))

/** Reads a config from URL search params, ignoring anything invalid. */
export function configFromParams(p: URLSearchParams): JourneyConfig {
  const dns = p.get('dns')
  const scenario = p.get('scenario')
  return {
    url: p.get('url') || DEFAULT_CONFIG.url,
    dnsCache: DNS_CACHE_OPTIONS.some((o) => o.value === dns) ? (dns as JourneyConfig['dnsCache']) : DEFAULT_CONFIG.dnsCache,
    scenario: SCENARIO_OPTIONS.some((o) => o.value === scenario) ? (scenario as JourneyConfig['scenario']) : DEFAULT_CONFIG.scenario,
    latencyMs: clamp(num(p.get('latency'), DEFAULT_CONFIG.latencyMs), 1, 1000),
    lossPercent: clamp(num(p.get('loss'), DEFAULT_CONFIG.lossPercent), 0, 50),
    serverTimeMs: clamp(num(p.get('server'), DEFAULT_CONFIG.serverTimeMs), 0, 5000),
    seed: num(p.get('seed'), DEFAULT_CONFIG.seed),
  }
}

export function paramsFromConfig(c: JourneyConfig, experiment: string | null): URLSearchParams {
  const p = new URLSearchParams()
  if (experiment) p.set('exp', experiment)
  if (c.url !== DEFAULT_CONFIG.url) p.set('url', c.url)
  if (c.dnsCache !== DEFAULT_CONFIG.dnsCache) p.set('dns', c.dnsCache)
  if (c.scenario !== DEFAULT_CONFIG.scenario) p.set('scenario', c.scenario)
  if (c.latencyMs !== DEFAULT_CONFIG.latencyMs) p.set('latency', String(c.latencyMs))
  if (c.lossPercent !== DEFAULT_CONFIG.lossPercent) p.set('loss', String(c.lossPercent))
  if (c.serverTimeMs !== DEFAULT_CONFIG.serverTimeMs) p.set('server', String(c.serverTimeMs))
  if (c.seed !== DEFAULT_CONFIG.seed) p.set('seed', String(c.seed))
  return p
}

// Real DNS lookups, on request only, using DNS over HTTPS (DoH) with the JSON
// API that Cloudflare (1.1.1.1) and Google (8.8.8.8) offer to browsers.
// This is the one place PacketWorld touches the real network.
// See docs/decisions/0018-optional-real-dns-lookup.md.

export interface DohRecord {
  name: string
  type: 'A' | 'AAAA' | 'CNAME' | 'SOA' | string
  ttl: number
  data: string
}

export interface DohResult {
  resolver: string
  name: string
  /** DNS response code, e.g. NOERROR or NXDOMAIN. */
  status: string
  answers: DohRecord[]
  /** Round-trip time of the HTTPS request in ms, as measured by the browser. */
  ms: number
  /** True when the resolver validated the answer with DNSSEC. */
  dnssec: boolean
}

export const RESOLVERS = [
  { id: 'cloudflare', label: 'Cloudflare (1.1.1.1)', url: 'https://cloudflare-dns.com/dns-query' },
  { id: 'google', label: 'Google (8.8.8.8)', url: 'https://dns.google/resolve' },
] as const

const TYPES: Record<number, string> = { 1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA' }
const RCODES: Record<number, string> = { 0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 4: 'NOTIMP', 5: 'REFUSED' }

interface DohJson {
  Status: number
  AD?: boolean
  Answer?: { name: string; type: number; TTL: number; data: string }[]
  Authority?: { name: string; type: number; TTL: number; data: string }[]
}

/** Turns a DoH JSON body into our result shape. Exported for tests. */
export function parseDoh(json: DohJson, resolver: string, name: string, ms: number): DohResult {
  return {
    resolver,
    name,
    status: RCODES[json.Status] ?? `RCODE ${json.Status}`,
    answers: (json.Answer ?? []).map((a) => ({ name: a.name.replace(/\.$/, ''), type: TYPES[a.type] ?? `TYPE${a.type}`, ttl: a.TTL, data: a.data.replace(/\.$/, '') })),
    ms: Math.round(ms),
    dnssec: !!json.AD,
  }
}

/** Looks up `name` for real. Throws on network errors or when the resolver can't be reached. */
export async function lookup(name: string, type: 'A' | 'AAAA', resolverId: (typeof RESOLVERS)[number]['id'] = 'cloudflare'): Promise<DohResult> {
  const resolver = RESOLVERS.find((r) => r.id === resolverId)!
  const url = `${resolver.url}?name=${encodeURIComponent(name)}&type=${type}`
  const start = performance.now()
  const res = await fetch(url, { headers: { accept: 'application/dns-json' }, cache: 'no-store' })
  const ms = performance.now() - start
  if (!res.ok) throw new Error(`${resolver.label} answered HTTP ${res.status}`)
  return parseDoh((await res.json()) as DohJson, resolver.label, name, ms)
}

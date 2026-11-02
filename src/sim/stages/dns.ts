import { formatMs, ipv4, natIn, natOut, udp, type JourneyBuilder, type PacketSpec } from '../builder'
import { ADDR, PORTS, authServerName, tldServerIp, tldServerName } from '../topology'
import type { Endpoint, Explanation, Field, NodeId } from '../types'

// Stage 1: DNS. Turns the hostname into an IP address.
//
// Accuracy notes (docs/ACCURACY.md):
// - The full root → TLD → authoritative walk only happens when nothing is
//   cached. The cache mode decides which steps run.
// - The client's stub resolver sends a recursive query (RD=1). The recursive
//   resolver then sends iterative queries (RD=0) to the hierarchy.
// - Browsers usually ask for A and AAAA records in parallel; we show only A
//   (IPv4) to keep the picture readable.

const ANSWER_TTL = 3600
const CACHED_TTL_LEFT = 2187

/** Wire length of a domain name: one length byte per label, plus the root byte. */
function nameLength(name: string): number {
  return name.split('.').reduce((n, label) => n + label.length + 1, 0) + 1
}

interface DnsMessage {
  id: number
  flags: string
  question: string
  answer?: string[]
  authority?: string[]
  additional?: string[]
  rcode?: string
  /** Approximate DNS message size in bytes. */
  size: number
}

function dnsFields(m: DnsMessage): Field[] {
  const fields: Field[] = [
    { name: 'Transaction ID', value: `0x${m.id.toString(16).padStart(4, '0')}`, note: 'Matches a response to its query.' },
    { name: 'Flags', value: m.flags },
    { name: 'Question', value: m.question },
  ]
  if (m.rcode) fields.push({ name: 'Response code', value: m.rcode })
  if (m.answer) fields.push({ name: 'Answer', value: m.answer.join('\n') })
  if (m.authority) fields.push({ name: 'Authority', value: m.authority.join('\n') })
  if (m.additional) fields.push({ name: 'Additional', value: m.additional.join('\n') })
  return fields
}

function dnsPacket(opts: {
  label: string
  from: NodeId
  to: NodeId
  src: Endpoint
  dst: Endpoint
  message: DnsMessage
  natNotes?: { src?: string; dst?: string }
  beginner: Explanation
  technical: Explanation
}): PacketSpec {
  const { message, src, dst } = opts
  return {
    label: opts.label,
    protocol: 'dns',
    from: opts.from,
    to: opts.to,
    src,
    dst,
    transport: 'UDP',
    payloadBytes: message.size,
    encrypted: false,
    layers: [
      ipv4(src.ip, dst.ip, 'UDP', 20 + 8 + message.size, opts.natNotes),
      udp(src, dst, message.size),
      { name: 'DNS', protocol: 'dns', fields: dnsFields(message) },
    ],
    beginner: opts.beginner,
    technical: opts.technical,
    observerSees: [
      'Classic DNS over UDP port 53 is not encrypted: anyone on the path can read which name you looked up.',
      'Encrypted alternatives exist: DNS over HTTPS (DoH) and DNS over TLS (DoT).',
    ],
  }
}

/** Returns false when the lookup fails and the journey must stop. */
export function buildDns(b: JourneyBuilder, notes: string[]): boolean {
  const { target, config } = b
  const host = target.host
  const q = `${host}. IN A`
  const qSize = 12 + nameLength(host) + 4 + 11 // header + question + EDNS0 OPT record
  const nx = config.scenario === 'dns-nxdomain'
  let mode = config.dnsCache
  if (nx && (mode === 'resolver-cached' || mode === 'os-cached' || mode === 'browser-cached')) {
    mode = 'tld-cached'
    notes.push('A name that does not exist cannot be in the cache as an address, so the lookup goes to the resolver anyway.')
  }

  const client: Endpoint = { ip: ADDR.client, port: PORTS.clientDns }
  const resolver: Endpoint = { ip: ADDR.resolver, port: 53 }
  const resolverOut: Endpoint = { ip: ADDR.resolver, port: PORTS.resolverOut }
  const ip = target.serverIp
  const found = { resolvedIp: ip, browser: 'connecting' as const }

  // 1. Browser cache
  const browserHit = mode === 'browser-cached'
  b.local(
    'dns',
    'client',
    browserHit ? 'Browser DNS cache: hit' : 'Browser DNS cache: miss',
    browserHit
      ? {
          beginner: `Your browser looked up ${host} a moment ago and still remembers it is at ${ip}. No need to ask anyone.`,
          technical: `Browser host cache hit for ${host} → ${ip}. Chromium keeps its own host cache (about a minute by default) in front of the OS resolver.`,
        }
      : {
          beginner: `Your browser knows the name ${host}, but computers connect using numeric IP addresses. First it checks its own short-term memory: no luck.`,
          technical: `Browser host cache miss for ${host}. Next stop: the operating system's stub resolver.`,
          why: 'Checking memory first is fast. Asking the network takes thousands of times longer.',
          analogy: 'Before looking up a friend’s number, you first check whether you remember it.',
        },
    { duration: 0.1, onStart: { browser: 'resolving' }, onEnd: browserHit ? found : undefined, tone: browserHit ? 'success' : 'info' },
  )
  if (browserHit) return true

  // 2. OS cache
  const osHit = mode === 'os-cached'
  b.local(
    'dns',
    'client',
    osHit ? 'Operating system cache: hit' : 'Operating system cache: miss',
    osHit
      ? {
          beginner: `The operating system remembers ${host} from another app's recent lookup. Answer found without using the network.`,
          technical: `OS stub resolver cache hit (e.g. systemd-resolved, mDNSResponder or the Windows DNS Client service). TTL still valid, so no query is sent.`,
        }
      : {
          beginner: 'The browser asks the operating system. It checks its own cache (and the hosts file): not there either.',
          technical: 'OS stub resolver: hosts file and cache miss. The stub does not walk the DNS tree itself; it sends one recursive query to the configured resolver.',
          why: 'Every app on your computer shares this memory, so one app’s lookup can help another.',
          analogy: 'Checking the family address book after your own memory fails.',
        },
    { duration: 0.5, onEnd: osHit ? found : undefined, tone: osHit ? 'success' : 'info' },
  )
  if (osHit) return true

  // 3. Query to the recursive resolver
  b.reliable(
    'dns',
    () =>
      dnsPacket({
        label: 'DNS Query',
        from: 'client',
        to: 'resolver',
        src: client,
        dst: resolver,
        natNotes: natOut(PORTS.natDns),
        message: { id: 0x3f2a, flags: 'Standard query, RD=1 (recursion desired)', question: q, size: qSize },
        beginner: {
          what: `Your computer asks the DNS resolver: "What is the IP address of ${host}?"`,
          why: 'The resolver does the hard work of finding the answer so your computer doesn’t have to.',
          analogy: 'Like calling directory enquiries and asking for a phone number by name.',
        },
        technical: {
          what: `Recursive query for ${host} A over UDP/53 to the configured resolver (${ADDR.resolver}).`,
          why: 'RD=1 asks the resolver to do the full resolution and return a final answer, not a referral.',
        },
      }),
    {
      rto: 1000,
      timerText: (rto) => ({
        beginner: `No answer after ${formatMs(rto)}, so your computer asks again. DNS over UDP has no built-in delivery guarantee; the asker just retries.`,
        technical: `Stub resolver timeout (${formatMs(rto)} here; real defaults vary, glibc uses 5 s). UDP has no retransmission, so the application layer retries.`,
      }),
    },
  )

  // 4. Resolver cache
  const resolverHit = mode === 'resolver-cached'
  b.local(
    'dns',
    'resolver',
    resolverHit ? 'Resolver cache: hit' : 'Resolver cache: miss',
    resolverHit
      ? {
          beginner: `The resolver answered this exact question recently for someone else, so it already knows the address.`,
          technical: `Resolver cache hit: ${host} A ${ip}, ${CACHED_TTL_LEFT} s of TTL remaining. Most lookups on busy resolvers end here.`,
        }
      : {
          beginner: `The resolver has not seen ${host} recently, so it has to go and find out.`,
          technical: `Resolver cache miss for ${host} A. It will resolve iteratively, starting from the closest cached delegation.`,
          why: 'A resolver serves thousands of people, so most popular names are already in its memory. This one isn’t.',
        },
    { duration: 0.2, tone: resolverHit ? 'success' : 'info' },
  )

  const tldName = tldServerName(target.tld)
  const tldIp = tldServerIp(target.tld)
  const nsName = authServerName(target)
  const tldEndpoint: Endpoint = { ip: tldIp, port: 53 }
  const timerText = (rto: number) => ({
    beginner: `No reply after ${formatMs(rto)}. The resolver asks again (it could also try another server for the same zone).`,
    technical: `Resolver retry after ${formatMs(rto)}. Real resolvers track per-server RTT and usually retry against a different nameserver of the zone.`,
  })

  if (!resolverHit) {
    // 5. Root
    if (mode === 'cold') {
      b.reliable(
        'dns',
        () =>
          dnsPacket({
            label: 'Query → root',
            from: 'resolver',
            to: 'root',
            src: resolverOut,
            dst: { ip: ADDR.root, port: 53 },
            message: { id: 0x8c41, flags: 'Standard query, RD=0', question: q, size: qSize },
            beginner: {
              what: `The resolver asks a root server where to find ${host}.`,
              why: 'Root servers sit at the top of DNS. They don’t know every address, but they know who runs each top-level domain like .com.',
              analogy: 'Asking the library’s front desk which floor has the books you need.',
            },
            technical: {
              what: `Iterative query (RD=0) to a.root-servers.net (${ADDR.root}).`,
              why: 'Resolvers know the root servers’ addresses from a built-in “root hints” file. Modern resolvers often use QNAME minimisation (RFC 9156) and send only “com.” here.',
            },
          }),
        { rto: 800, timerText },
      )
      b.packet(
        'dns',
        dnsPacket({
          label: `Referral to .${target.tld}`,
          from: 'root',
          to: 'resolver',
          src: { ip: ADDR.root, port: 53 },
          dst: resolverOut,
          message: {
            id: 0x8c41,
            flags: 'Response, AA=0 (referral)',
            question: q,
            rcode: 'NOERROR',
            authority: [`${target.tld}. 172800 IN NS ${tldName}.`],
            additional: [`${tldName}. 172800 IN A ${tldIp}`],
            size: qSize + 2 + 10 + nameLength(tldName) + 12 + 4,
          },
          beginner: {
            what: `The root server replies: “I don’t know ${host}, but the .${target.tld} servers do. Here is one.”`,
            why: 'This is a referral: a pointer one level down the DNS tree.',
          },
          technical: {
            what: `Referral: NS records for ${target.tld}. in the authority section, with a glue A record so the resolver can reach ${tldName}.`,
            why: 'The 172800 s (2 day) TTL is why resolvers almost always have TLD servers cached and rarely ask the root.',
          },
        }),
      )
    }

    // 6. TLD
    b.reliable(
      'dns',
      () =>
        dnsPacket({
          label: `Query → .${target.tld}`,
          from: 'resolver',
          to: 'tld',
          src: resolverOut,
          dst: tldEndpoint,
          message: { id: 0x51d7, flags: 'Standard query, RD=0', question: q, size: qSize },
          beginner: {
            what: `The resolver asks the .${target.tld} server about ${host}.`,
            why: `The .${target.tld} servers keep a list of every domain registered under .${target.tld} and who answers for it.`,
          },
          technical: {
            what: `Iterative query to ${tldName} (${tldIp}).`,
            why:
              mode === 'tld-cached'
                ? `The resolver already had the ${target.tld}. NS set cached, so it skipped the root entirely. This is the common case.`
                : `Following the referral from the root.`,
          },
        }),
      { rto: 800, timerText },
    )

    if (nx) {
      b.packet(
        'dns',
        dnsPacket({
          label: 'NXDOMAIN',
          from: 'tld',
          to: 'resolver',
          src: tldEndpoint,
          dst: resolverOut,
          message: {
            id: 0x51d7,
            flags: 'Response, AA=1',
            question: q,
            rcode: 'NXDOMAIN (3): name does not exist',
            authority: [`${target.tld}. 900 IN SOA ${tldName}. … (negative-caching TTL 900)`],
            size: qSize + 70,
          },
          beginner: {
            what: `The .${target.tld} server says: “Nobody has registered ${target.zone}.”`,
            why: 'Without an IP address there is nothing to connect to. The journey stops here.',
          },
          technical: {
            what: `NXDOMAIN from the ${target.tld} zone, with its SOA record in the authority section.`,
            why: 'The SOA’s minimum field sets how long resolvers may cache this negative answer (RFC 2308).',
          },
        }),
        { tone: 'error' },
      )
      b.local(
        'dns',
        'resolver',
        'Resolver caches the negative answer',
        {
          beginner: 'The resolver remembers that this name does not exist, so it can answer quickly next time.',
          technical: 'Negative caching per RFC 2308, for the SOA minimum TTL (900 s here).',
        },
        { duration: 0.2 },
      )
      b.packet(
        'dns',
        dnsPacket({
          label: 'NXDOMAIN',
          from: 'resolver',
          to: 'client',
          src: resolver,
          dst: client,
          natNotes: natIn(PORTS.natDns),
          message: { id: 0x3f2a, flags: 'Response, RD=1, RA=1', question: q, rcode: 'NXDOMAIN (3)', size: qSize + 70 },
          beginner: {
            what: `The resolver tells your computer: ${host} does not exist.`,
            why: 'The browser cannot continue without an address, so it shows an error page.',
          },
          technical: { what: 'NXDOMAIN relayed to the stub resolver.', why: 'The browser maps this to its “site can’t be reached” error.' },
        }),
        {
          tone: 'error',
          onEnd: {
            browser: 'error',
            error: {
              title: 'This site can’t be reached',
              code: 'DNS_PROBE_FINISHED_NXDOMAIN',
              detail: `${host}’s server IP address could not be found.`,
            },
          },
        },
      )
      return false
    }

    b.packet(
      'dns',
      dnsPacket({
        label: `Referral to ${nsName}`,
        from: 'tld',
        to: 'resolver',
        src: tldEndpoint,
        dst: resolverOut,
        message: {
          id: 0x51d7,
          flags: 'Response, AA=0 (referral)',
          question: q,
          rcode: 'NOERROR',
          authority: [`${target.zone}. 172800 IN NS ${nsName}.`],
          additional: [`${nsName}. 172800 IN A ${ADDR.auth}`],
          size: qSize + 2 + 10 + nameLength(nsName) + 12 + 4,
        },
        beginner: {
          what: `The .${target.tld} server replies: “${target.zone} is handled by ${nsName}. Ask them.”`,
          why: 'Each domain owner chooses which servers hold the real records for their domain.',
        },
        technical: {
          what: `Referral to ${target.zone}'s nameservers. ${nsName} is inside the zone it serves, so the TLD includes a glue A record.`,
          why: 'Without glue the resolver would need to resolve ns1 before it could ask ns1: a chicken-and-egg problem.',
        },
      }),
    )

    // 7. Authoritative
    const authEndpoint: Endpoint = { ip: ADDR.auth, port: 53 }
    b.reliable(
      'dns',
      () =>
        dnsPacket({
          label: 'Query → authoritative',
          from: 'resolver',
          to: 'auth',
          src: resolverOut,
          dst: authEndpoint,
          message: { id: 0xa60e, flags: 'Standard query, RD=0', question: q, size: qSize },
          beginner: {
            what: `Finally the resolver asks the server that is in charge of ${target.zone}.`,
            why: 'This server holds the official records, so its answer is authoritative.',
          },
          technical: { what: `Iterative query to ${nsName} (${ADDR.auth}).`, why: 'Last step of the delegation chain.' },
        }),
      { rto: 800, timerText },
    )
    b.packet(
      'dns',
      dnsPacket({
        label: `A ${ip}`,
        from: 'auth',
        to: 'resolver',
        src: authEndpoint,
        dst: resolverOut,
        message: {
          id: 0xa60e,
          flags: 'Response, AA=1 (authoritative answer)',
          question: q,
          rcode: 'NOERROR',
          answer: [`${host}. ${ANSWER_TTL} IN A ${ip}`],
          size: qSize + 16,
        },
        beginner: {
          what: `The authoritative server answers: “${host} is at ${ip}.”`,
          why: 'This is the address your browser needs to connect.',
        },
        technical: {
          what: `Authoritative answer: A ${ip}, TTL ${ANSWER_TTL} s.`,
          why: 'The TTL tells every cache along the way how long it may reuse this answer.',
        },
      }),
    )
    b.local(
      'dns',
      'resolver',
      `Resolver caches the answer (TTL ${ANSWER_TTL} s)`,
      {
        beginner: 'The resolver saves the answer for an hour, so the next person who asks gets it instantly.',
        technical: `Cached ${host} A ${ip} for ${ANSWER_TTL} s, plus the NS and glue records it learned on the way.`,
        why: 'The TTL (time to live) sets how long the answer may be reused. After that, the resolver must ask again in case the address changed.',
      },
      { duration: 0.2 },
    )
  }

  // 8. Response to the client
  const ttl = resolverHit ? CACHED_TTL_LEFT : ANSWER_TTL
  b.packet(
    'dns',
    dnsPacket({
      label: 'DNS Response',
      from: 'resolver',
      to: 'client',
      src: resolver,
      dst: client,
      natNotes: natIn(PORTS.natDns),
      message: {
        id: 0x3f2a,
        flags: 'Response, RD=1, RA=1 (recursion available)',
        question: q,
        rcode: 'NOERROR',
        answer: [`${host}. ${ttl} IN A ${ip}`],
        size: qSize + 16,
      },
      beginner: {
        what: `The resolver gives your computer the answer: ${host} is at ${ip}.`,
        why: 'Now the browser knows where to send its packets.',
        analogy: 'You now have the street address, so you can go and knock on the door.',
      },
      technical: {
        what: `Response to transaction 0x3f2a: ${host} A ${ip}, TTL ${ttl}.`,
        why: 'AA=0 because the resolver is relaying (or serving from cache), not authoritative itself.',
      },
    }),
    { tone: 'success' },
  )
  b.local(
    'dns',
    'client',
    `Resolved: ${host} → ${ip}`,
    {
      beginner: `Your computer and browser both remember the address for a while. DNS is done; time to connect.`,
      technical: `Stub and browser caches store the record for up to ${ttl} s. Total DNS time: ${formatMs(b.now)}.`,
      why: 'Without the IP address the browser can’t send a single packet to the website.',
      analogy: 'You’ve found the shop’s street address. Now you can go there.',
    },
    { duration: 0.1, onEnd: found, tone: 'success' },
  )
  return true
}

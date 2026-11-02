// Short, plain definitions for words a Class 11 student may not know yet.
// Shown in small bubbles when a learner taps an underlined word.
// Keep each `short` to one sentence. See docs/CONTENT_GUIDE.md.

export interface Term {
  term: string
  /** Words in running text that should link to this term (lowercase). */
  match: string[]
  short: string
  example?: string
}

export const GLOSSARY: Term[] = [
  { term: 'Packet', match: ['packet', 'packets'], short: 'A small chunk of data with a "to" and "from" address on it, like a postcard.', example: 'A web page is split into many packets that travel separately.' },
  { term: 'IP address', match: ['ip address', 'ip addresses', 'address'], short: 'The number that identifies a computer on the internet, like a home address.', example: '203.0.113.48' },
  { term: 'Port', match: ['port', 'ports'], short: 'A number that says which program on a computer should get the data.', example: 'Websites use port 443.' },
  { term: 'Domain name', match: ['domain name', 'domain'], short: 'The human-friendly name of a website.', example: 'example.com' },
  { term: 'DNS', match: ['dns'], short: 'The internet’s phone book: it turns names like example.com into IP addresses.' },
  { term: 'Resolver', match: ['resolver'], short: 'A helper server that finds IP addresses for you and remembers recent answers.', example: 'Often run by your internet provider.' },
  { term: 'Cache', match: ['cache', 'cached', 'caches'], short: 'A short-term memory that keeps recent answers so they don’t have to be fetched again.' },
  { term: 'Root server', match: ['root server', 'root servers', 'root'], short: 'The top of the DNS system. It knows who runs each ending like .com or .org.' },
  { term: 'TLD', match: ['tld', '.com server', '.com servers'], short: 'Top-level domain: the last part of a name, like .com, .org or .in.' },
  { term: 'Authoritative server', match: ['authoritative'], short: 'The DNS server that holds the official answer for one website’s name.' },
  { term: 'TTL', match: ['ttl'], short: 'Time to live: how long an answer may be kept before it must be checked again.' },
  { term: 'Router', match: ['router', 'routers'], short: 'A device that passes packets towards their destination, one hop at a time.' },
  { term: 'TCP', match: ['tcp'], short: 'A set of rules that makes sure data arrives complete and in the right order.' },
  { term: 'UDP', match: ['udp'], short: 'A simpler, faster way to send data with no delivery guarantee.' },
  { term: 'Handshake', match: ['handshake', 'three-step greeting'], short: 'A short exchange where two computers agree to talk before sending real data.' },
  { term: 'SYN', match: ['syn'], short: '"Synchronise": the first message of a TCP handshake, meaning "can we talk?"' },
  { term: 'ACK', match: ['ack', 'acknowledgment', 'acknowledges'], short: '"Acknowledge": a reply that says "I got your message".' },
  { term: 'Sequence number', match: ['sequence number', 'sequence numbers', 'starting number'], short: 'A counter that numbers every byte sent, so missing or out-of-order data can be spotted.' },
  { term: 'Connection', match: ['connection'], short: 'An agreed link between two programs, so they can keep exchanging data.' },
  { term: 'Retransmission', match: ['retransmit', 'retransmits', 'retransmitted', 'retransmission', 'sends it again', 'asks again'], short: 'Sending the same data again because it seems to have been lost.' },
  { term: 'Timeout', match: ['timeout', 'timer'], short: 'A waiting limit. If no reply comes in time, the sender acts (usually tries again).' },
  { term: 'TLS', match: ['tls'], short: 'The security layer that encrypts web traffic. It’s the “S” in HTTPS.' },
  { term: 'Encryption', match: ['encryption', 'encrypted', 'encrypt'], short: 'Scrambling data so only someone with the right key can read it.' },
  { term: 'Key', match: ['secret key', 'key', 'keys'], short: 'A secret number used to lock (encrypt) and unlock (decrypt) data.' },
  { term: 'Certificate', match: ['certificate', 'id card'], short: 'A digital ID card that proves a website really is who it says it is.' },
  { term: 'Certificate Authority', match: ['certificate authority', 'authority you trust', 'trusted authority'], short: 'A trusted organisation that signs certificates, like a passport office.' },
  { term: 'HTTP', match: ['http'], short: 'The language browsers and web servers use to ask for and send web pages.' },
  { term: 'HTTPS', match: ['https'], short: 'HTTP inside TLS: the same requests, but encrypted and verified.' },
  { term: 'Request', match: ['request'], short: 'A message from the browser asking the server for something.' },
  { term: 'Response', match: ['response'], short: 'The server’s reply to a request.' },
  { term: 'Status code', match: ['status code', '200', '404'], short: 'A 3-digit number in a response: 200 means OK, 404 means not found.' },
  { term: 'Header', match: ['header', 'headers', 'labels describing it'], short: 'Extra information attached to a request or response, like a label on a parcel.' },
  { term: 'HTML', match: ['html'], short: 'The code that describes a web page’s structure: headings, text, links.' },
  { term: 'Stylesheet', match: ['stylesheet', 'css'], short: 'A CSS file that says how the page should look: colours, fonts, layout.' },
  { term: 'Server', match: ['server'], short: 'A computer that stores websites and answers requests from browsers.' },
  { term: 'Browser', match: ['browser'], short: 'The app you use to visit websites, like Chrome, Safari or Firefox.' },
  { term: 'Latency', match: ['latency', 'delay'], short: 'How long a packet takes to travel from one place to another.' },
  { term: 'Round trip', match: ['round trip', 'rtt'], short: 'The time to send a message and get the reply back.' },
  { term: 'NAT', match: ['nat'], short: 'Your router swapping your device’s private address for its one public address.' },
]

const index = new Map<string, Term>()
for (const t of GLOSSARY) for (const m of t.match) index.set(m, t)

/** Longest phrases first, so "root server" wins over "root" and "server". */
const phrases = [...index.keys()].sort((a, b) => b.length - a.length)
const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
export const TERM_PATTERN = new RegExp(`(?<![\\w-])(${escaped.join('|')})(?![\\w-])`, 'gi')

export function lookupTerm(word: string): Term | undefined {
  return index.get(word.toLowerCase())
}

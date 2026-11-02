import type { QuizQuestion } from '../components/Quiz'

// The ten lessons of the Learn section. Prose supports **bold** and `code`.
// Writing guidelines: docs/CONTENT_GUIDE.md.

export type LabKey = 'overview' | 'address' | 'dns' | 'tcp-udp' | 'handshake' | 'tls' | 'http' | 'routing' | 'nat' | 'latency'

export interface Lesson {
  slug: string
  title: string
  summary: string
  minutes: number
  intro: string
  lab: LabKey
  labHint: string
  simple: string[]
  technical: string[]
  quiz: QuizQuestion[]
}

export const LESSONS: Lesson[] = [
  {
    slug: 'how-the-internet-works',
    title: 'How the internet works',
    summary: 'The big picture: what happens between typing a URL and seeing a page.',
    minutes: 6,
    intro:
      'The internet is a network of networks: millions of machines that agree on a few shared rules, called protocols. Opening a website uses four of them, one after another.',
    lab: 'overview',
    labHint: 'Press play and follow the whole journey. Click any machine or packet to inspect it.',
    simple: [
      'Everything you send is chopped into small pieces called **packets**. Each packet carries an address, like an envelope, and travels on its own.',
      'First your browser needs the server’s numeric address, so it asks **DNS**. Then it opens a connection with **TCP**, makes it private with **TLS**, and finally asks for the page with **HTTP**.',
      'Each layer does one job and relies on the one below. HTTP doesn’t worry about lost packets; TCP handles that. TCP doesn’t worry about the route; routers handle that.',
    ],
    technical: [
      'The stack is layered: application protocols (HTTP, DNS) sit on transport protocols (TCP, UDP, QUIC), which sit on IP, which runs over whatever link layer is present (Wi-Fi, Ethernet, fibre).',
      'For an HTTPS page loaded with HTTP/1.1 or HTTP/2, that means DNS (usually UDP), a TCP handshake, a TLS 1.3 handshake on top of TCP, then HTTP requests inside TLS records. HTTP/3 replaces TCP+TLS with QUIC over UDP.',
      'IP itself is best effort: packets can be lost, duplicated or reordered. Reliability is added end to end by the transport layer, not by the network.',
    ],
    quiz: [
      {
        question: 'In what order does the browser use these protocols to load an HTTPS page over HTTP/1.1?',
        options: ['HTTP, TLS, TCP, DNS', 'DNS, TCP, TLS, HTTP', 'TCP, DNS, HTTP, TLS', 'DNS, TLS, TCP, HTTP'],
        answer: 1,
        explanation: 'It needs an address (DNS) before it can connect (TCP), must connect before securing the connection (TLS), and only then sends the request (HTTP).',
      },
      {
        question: 'What is a packet?',
        options: ['A whole web page', 'A small piece of data with addressing information', 'A type of cable', 'A server that stores websites'],
        answer: 1,
        explanation: 'Data is split into packets, each with headers (like source and destination addresses) so the network can deliver it independently.',
      },
      {
        question: 'Which layer makes sure lost data is resent when loading a page over HTTP/1.1?',
        options: ['IP', 'DNS', 'TCP', 'HTML'],
        answer: 2,
        explanation: 'IP is best effort. TCP numbers the bytes, acknowledges them and retransmits what is missing.',
      },
    ],
  },
  {
    slug: 'ip-addresses-and-ports',
    title: 'IP addresses and ports',
    summary: 'Which machine, and which program on that machine.',
    minutes: 5,
    intro: 'A packet needs to reach the right computer, and then the right program on that computer. IP addresses handle the first part, ports the second.',
    lab: 'address',
    labHint: 'Pick a service, then open more tabs and watch the source port change.',
    simple: [
      'An **IP address** is like a building’s street address. Routers use it to move packets across the internet.',
      'A **port** is like an apartment number inside the building. It tells the computer which program should get the data: the web server, the mail server, and so on.',
      'Your home devices use **private addresses** like 192.168.1.23 that only work inside your home. Your router has a public address that the rest of the internet sees.',
    ],
    technical: [
      'IPv4 addresses are 32 bits, written as four decimal octets. IPv6 addresses are 128 bits, written in hexadecimal groups (e.g. `2001:db8::30`). Both are in use today; many networks are dual-stack.',
      'Ports are 16-bit numbers in the TCP or UDP header. Servers listen on well-known ports (443 HTTPS, 80 HTTP, 53 DNS, 22 SSH); clients use ephemeral ports chosen by the OS (often 49152–65535, Linux defaults to 32768–60999).',
      'A connection is identified by its 5-tuple: protocol, source IP, source port, destination IP, destination port. That is why many tabs to the same server can coexist.',
    ],
    quiz: [
      {
        question: 'What does a port number identify?',
        options: ['The country a server is in', 'A program or service on a machine', 'The speed of the connection', 'The website’s owner'],
        answer: 1,
        explanation: 'The IP address gets the packet to the machine; the port tells the operating system which program it is for.',
      },
      {
        question: 'Two browser tabs connect to the same HTTPS server. What is different between their connections?',
        options: ['The server’s IP address', 'The destination port', 'The client’s source port', 'Nothing; they share one connection'],
        answer: 2,
        explanation: 'The OS gives each connection a different ephemeral source port, so the 5-tuples differ. (With HTTP/2 or HTTP/3, tabs may also share one connection.)',
      },
      {
        question: 'HTTP/3 uses port 443 like HTTPS. Which transport does it use?',
        options: ['TCP', 'UDP (via QUIC)', 'ICMP', 'DNS'],
        answer: 1,
        explanation: 'HTTP/3 runs over QUIC, which runs over UDP. Same port number, different transport protocol.',
      },
    ],
  },
  {
    slug: 'dns',
    title: 'DNS explained',
    summary: 'How names become addresses, and why most lookups never reach the root.',
    minutes: 7,
    intro: 'Humans remember names like example.com. Computers connect to numbers like 203.0.113.48. DNS, the Domain Name System, translates between them.',
    lab: 'dns',
    labHint: 'Switch between cache levels and compare how many packets each lookup needs.',
    simple: [
      'A **domain name** is a human-friendly label. An **IP address** is the machine’s actual address. DNS is the internet’s phone book.',
      'Your computer asks a **resolver** (usually run by your internet provider or a public service). If the resolver doesn’t know the answer, it asks the **root** servers, which point to the **.com** servers, which point to the domain’s own **authoritative** server.',
      'Answers are **cached** at every step: in your browser, your operating system and the resolver. That is why most lookups take a millisecond or two, and the full walk you see with a cold cache is rare.',
    ],
    technical: [
      'The stub resolver in your OS sends a recursive query (RD=1) to a recursive resolver, normally over UDP port 53. The resolver answers from cache or resolves iteratively (RD=0), following NS referrals from the root down.',
      'Every record has a TTL. TLD delegations typically have TTLs of two days, so resolvers rarely contact the root. Negative answers (NXDOMAIN) are cached too, for the SOA minimum TTL (RFC 2308).',
      'Root servers are 13 named identities (a–m.root-servers.net) served by more than a thousand anycast instances worldwide. Classic DNS is unencrypted; DNS over HTTPS (DoH) and DNS over TLS (DoT) hide queries from on-path observers.',
    ],
    quiz: [
      {
        question: 'Your laptop looks up a popular site a few seconds after a colleague on the same network did. What usually answers?',
        options: ['A root server', 'The .com TLD server', 'The resolver’s cache', 'The website’s web server'],
        answer: 2,
        explanation: 'The resolver cached the answer for its TTL, so it replies immediately without asking anyone else.',
      },
      {
        question: 'What does a root server reply when asked for example.com?',
        options: ['The IP address of example.com', 'A referral to the .com servers', 'NXDOMAIN', 'The web page'],
        answer: 1,
        explanation: 'Root servers only know who runs each top-level domain. They return a referral (NS records) one level down.',
      },
      {
        question: 'Which DNS server gives the official, final answer for example.com?',
        options: ['The recursive resolver', 'The root server', 'The authoritative server for example.com', 'Your router'],
        answer: 2,
        explanation: 'The domain owner configures authoritative servers that hold the real records (they answer with AA=1).',
      },
    ],
  },
  {
    slug: 'tcp-vs-udp',
    title: 'TCP vs UDP',
    summary: 'Reliable and ordered, or fast and simple. And where QUIC fits.',
    minutes: 6,
    intro: 'Not everything on the internet uses TCP. Transport protocols make different trade-offs, and choosing one is a design decision.',
    lab: 'tcp-udp',
    labHint: 'Send five messages over each protocol, with and without losing message 3.',
    simple: [
      '**UDP** just sends packets. If one is lost, nobody notices unless the app checks. It is quick and simple, which suits DNS lookups, video calls and games, where a late packet is useless anyway.',
      '**TCP** numbers everything, confirms what arrived and resends what didn’t. Data always arrives complete and in order, which is what web pages, email and file downloads need.',
      'The price of TCP’s reliability is waiting: when one packet is lost, everything after it is held back until the gap is filled.',
    ],
    technical: [
      'UDP adds only ports, a length and a checksum to IP. No connection, no ordering, no retransmission, no congestion control: applications build what they need on top.',
      'TCP provides a reliable, ordered byte stream with flow control (receive window) and congestion control. A loss causes head-of-line blocking: later bytes wait in the receive buffer until the missing segment is retransmitted.',
      '**QUIC** (used by HTTP/3) runs over UDP but implements its own reliability, congestion control and encryption (TLS 1.3 built in), with independent streams so one lost packet only stalls its own stream.',
    ],
    quiz: [
      {
        question: 'Which protocol does a typical DNS lookup use?',
        options: ['TCP', 'UDP', 'HTTP', 'TLS'],
        answer: 1,
        explanation: 'A query and its answer usually fit in one packet each, so UDP’s low overhead fits. DNS falls back to TCP for large responses.',
      },
      {
        question: 'Message 3 of 5 is lost over TCP. When does the receiving app get messages 4 and 5?',
        options: ['Immediately, before 3', 'Never', 'After 3 is retransmitted, in order', 'Only if the sender restarts'],
        answer: 2,
        explanation: 'TCP delivers a strictly ordered stream, so 4 and 5 wait in the buffer until 3 arrives. This is head-of-line blocking.',
      },
      {
        question: 'HTTP/3 runs over QUIC. What is QUIC built on?',
        options: ['TCP', 'UDP', 'DNS', 'Raw Ethernet'],
        answer: 1,
        explanation: 'QUIC runs over UDP and adds its own reliability and encryption, avoiding TCP’s head-of-line blocking between streams.',
      },
    ],
  },
  {
    slug: 'tcp-handshake',
    title: 'TCP three-way handshake',
    summary: 'SYN, SYN-ACK, ACK: what each packet does, and what happens when one goes missing.',
    minutes: 8,
    intro: 'Before any data flows over TCP, both sides exchange three small packets to agree that they are talking and where their byte counts start.',
    lab: 'handshake',
    labHint: 'Play the normal handshake first, then use Break the handshake. Click any arrow to inspect the packet.',
    simple: [
      '**SYN**: the client says “I’d like to talk, and I’ll start counting my bytes from 1000.”',
      '**SYN-ACK**: the server says “Got it (that’s the ACK), and I’ll start counting mine from 5000 (that’s the SYN).”',
      '**ACK**: the client says “Got yours too.” Now both sides know the other can send and receive. Three messages is the minimum for that: each side must send its starting number and hear it confirmed, and the middle packet does two jobs at once.',
    ],
    technical: [
      'The SYN carries the client’s initial sequence number (ISN) and options (MSS, SACK permitted, window scaling). The SYN flag consumes one sequence number, so the server acknowledges ISN+1. Real ISNs are random 32-bit values (RFC 6528); this site uses 1000 and 5000 so the arithmetic is easy to follow.',
      'States: the client goes CLOSED → SYN-SENT → ESTABLISHED (on receiving the SYN-ACK). The server goes LISTEN → SYN-RECEIVED → ESTABLISHED (on receiving the ACK).',
      'A lost SYN or SYN-ACK is recovered by retransmission after the RTO (initially 1 s, doubling each time). A lost final ACK needs no retransmission: the client’s first data segment carries the same acknowledgment. If a server never answers, Linux gives up after 6 retries, about 127 s.',
    ],
    quiz: [
      {
        question: 'The client’s SYN has seq=1000. What acknowledgment number does the SYN-ACK carry?',
        options: ['1000', '1001', '5000', '5001'],
        answer: 1,
        explanation: 'The SYN consumes one sequence number, so the server acknowledges 1001: “I have everything up to 1000; send 1001 next.”',
      },
      {
        question: 'The client’s SYN is lost. What happens?',
        options: ['The server sends a new SYN-ACK', 'The client retransmits the SYN after a timeout', 'The connection is established anyway', 'The router resends it'],
        answer: 1,
        explanation: 'Nobody knows the SYN was lost. The client’s retransmission timer fires (1 s initially) and it sends the same SYN again.',
      },
      {
        question: 'The final ACK of the handshake is lost. What is the usual outcome?',
        options: [
          'The connection fails',
          'The client must start over with a new SYN',
          'The next data packet from the client also carries the ACK, completing the handshake',
          'The server ignores the client forever',
        ],
        answer: 2,
        explanation: 'Every later segment from the client has the ACK flag and ack=5001, so the server moves to ESTABLISHED when the first data arrives.',
      },
    ],
  },
  {
    slug: 'tls-https',
    title: 'TLS and HTTPS',
    summary: 'Keys, certificates, and what encryption hides (and doesn’t).',
    minutes: 9,
    intro: 'HTTPS is HTTP inside TLS. TLS gives you three things: privacy (nobody can read), integrity (nobody can change) and authentication (you are talking to the real site).',
    lab: 'tls',
    labHint: 'Compare a valid certificate, an expired one, and plain http:// with no TLS at all.',
    simple: [
      '**Encryption** scrambles data so only someone with the right key can read it. TLS uses a **symmetric key**: one secret shared by your browser and the server, used to lock and unlock everything they send.',
      'The trick is agreeing on that secret over a network anyone can watch. Each side contributes half of a mathematical recipe; combined, they produce the same secret, but an observer who sees both halves cannot. **Public and private keys** are used for proving identity: anyone can check a signature with the public key, but only the owner of the private key can make one.',
      'The server proves who it is with a **certificate**: a digital ID card saying “this key belongs to example.com”, signed by a **Certificate Authority** your browser already trusts. If the certificate is expired, for the wrong name, or not signed by a trusted CA, the browser shows a warning and stops.',
    ],
    technical: [
      'TLS 1.3 (RFC 8446) completes in one round trip: the ClientHello carries an ECDHE key share (e.g. x25519); the server replies with its key share in ServerHello, and both derive handshake keys via HKDF. Everything after ServerHello, including the certificate, is encrypted. TLS 1.2 needed two round trips and sent the certificate in clear.',
      'Authentication: the server sends its certificate chain and a CertificateVerify signature over the handshake transcript with the certificate’s private key. The client validates the chain to a trusted root, the hostname against the SAN, and the validity period. Finished messages (HMACs over the transcript) detect tampering.',
      'TLS and TCP are separate handshakes: TCP connects first, then TLS runs over it. With HTTP/3, QUIC merges transport and TLS 1.3 setup. Encryption does not hide metadata: IP addresses, ports, packet sizes and timing, and usually the SNI hostname (unless Encrypted Client Hello is used) remain visible.',
    ],
    quiz: [
      {
        question: 'How many round trips does a full TLS 1.3 handshake take?',
        options: ['Zero', 'One', 'Two', 'Three'],
        answer: 1,
        explanation: 'The client sends its key share up front, so after one exchange both sides have keys. TLS 1.2 needed two.',
      },
      {
        question: 'What does a certificate prove?',
        options: [
          'That the website is safe to use',
          'That a trusted authority vouches this public key belongs to this domain name',
          'That the connection is fast',
          'That the server has no viruses',
        ],
        answer: 1,
        explanation: 'A CA-signed certificate binds a public key to a name. It says nothing about whether the site’s owner is honest.',
      },
      {
        question: 'On an HTTPS connection, what can someone on the same Wi-Fi still see?',
        options: ['The full URL and page content', 'Your passwords', 'Which server IP you talk to and how much data flows', 'Nothing at all'],
        answer: 2,
        explanation: 'Content, URLs and headers are encrypted, but IP addresses, ports, sizes, timing and usually the hostname (via SNI or DNS) are visible.',
      },
    ],
  },
  {
    slug: 'http',
    title: 'HTTP requests and responses',
    summary: 'Methods, paths, headers, status codes and bodies.',
    minutes: 6,
    intro: 'HTTP is the language browsers and servers use to ask for and deliver web content. Every page load is a conversation of requests and responses.',
    lab: 'http',
    labHint: 'Click the parts of the request and response, then play the exchange with and without a missing page.',
    simple: [
      'A **request** says what you want: a **method** (GET to fetch), a **path** (/ for the home page) and **headers** with extra details, like which site you mean (Host).',
      'A **response** starts with a **status code**: 200 means OK, 404 means not found, 500 means the server had a problem. Then come headers describing the content, then the **body**: the HTML itself.',
      'The HTML mentions other files (stylesheets, scripts, images, fonts). The browser requests each of them too, often dozens per page.',
    ],
    technical: [
      'HTTP/1.1 messages are text: a start line, header fields, an empty line (CRLF), then an optional body. HTTP/2 and HTTP/3 keep the same semantics (methods, status codes, headers) but use binary frames and multiplex many requests over one connection.',
      'Status classes: 1xx informational, 2xx success, 3xx redirection (e.g. 301, 304 Not Modified), 4xx client errors (404, 403), 5xx server errors (500, 503). A 404 is a successful network exchange with an application-level “no”.',
      'Keep-alive connections are reused for subsequent requests, avoiding repeated TCP and TLS handshakes. Caching headers (Cache-Control, ETag) let browsers skip requests entirely.',
    ],
    quiz: [
      {
        question: 'Which part of the request tells the server which website you want?',
        options: ['The method', 'The Host header', 'The status code', 'The body'],
        answer: 1,
        explanation: 'Many sites can share one IP address. The Host header (required in HTTP/1.1) names the site.',
      },
      {
        question: 'A server returns 404. What does that mean about the network?',
        options: ['DNS failed', 'The TCP connection was lost', 'The network worked; the requested page does not exist', 'The certificate is invalid'],
        answer: 2,
        explanation: 'To receive any status code, DNS, TCP and TLS all had to succeed. 404 is the server’s answer about the resource.',
      },
      {
        question: 'Why does a second request for style.css not need a new TCP handshake?',
        options: ['CSS files don’t use TCP', 'The connection is kept alive and reused', 'The browser guesses the file', 'DNS caches the file'],
        answer: 1,
        explanation: 'HTTP keep-alive (default in HTTP/1.1) reuses the existing TCP+TLS connection for further requests.',
      },
    ],
  },
  {
    slug: 'routing',
    title: 'Routers and packet routing',
    summary: 'No router knows the whole path. Each just picks the next hop.',
    minutes: 6,
    intro: 'Between your router and a server there may be fifteen or more routers, run by different companies. None of them plans the whole journey.',
    lab: 'routing',
    labHint: 'Send a packet, then cut a link on its path and send another.',
    simple: [
      'A router reads a packet’s destination address and checks its **routing table**: a list saying “for addresses like this, send to that neighbour”. Then it forwards the packet and forgets about it.',
      'Routers constantly talk to their neighbours about which networks they can reach. If a link breaks, they find another way, and traffic flows around the damage.',
      'Packets from the same page load can even take different paths. That is why the diagrams on this site draw the internet as a dashed line, not a fixed chain of boxes.',
    ],
    technical: [
      'Forwarding uses longest-prefix match on the destination IP against the forwarding table. Each router decrements the IP TTL (IPv6: hop limit) and drops packets that reach 0, sending ICMP Time Exceeded (which is how traceroute works).',
      'Inside one organisation, interior gateway protocols such as OSPF or IS-IS compute shortest paths from link costs (Dijkstra, as in this lab). Between organisations (autonomous systems), BGP exchanges reachability and paths are chosen by policy, not just distance.',
      'After a failure, routing protocols need time to converge; packets may be dropped or loop briefly until TTL expires. Load balancing (ECMP) can spread one destination’s traffic across several equal-cost paths.',
    ],
    quiz: [
      {
        question: 'What does a router use to decide where to send a packet?',
        options: ['The packet’s content', 'The destination IP address and its routing table', 'The website’s name', 'The sender’s port'],
        answer: 1,
        explanation: 'Routers forward based on the destination address, matched against routes in their table.',
      },
      {
        question: 'Why does the TTL field exist?',
        options: ['To encrypt the packet', 'To stop packets from looping forever', 'To pick the fastest route', 'To count bytes'],
        answer: 1,
        explanation: 'Each router decrements TTL; at 0 the packet is dropped. A routing loop can therefore never trap a packet indefinitely.',
      },
      {
        question: 'Which protocol do networks run by different companies use to exchange routes?',
        options: ['DNS', 'BGP', 'HTTP', 'TLS'],
        answer: 1,
        explanation: 'BGP (Border Gateway Protocol) connects autonomous systems and carries the internet’s global routing information.',
      },
    ],
  },
  {
    slug: 'nat-and-firewalls',
    title: 'NAT and firewalls',
    summary: 'How a whole household shares one public address, and why strangers can’t walk in.',
    minutes: 6,
    intro: 'Your laptop’s address, 192.168.1.23, means nothing on the internet. Your router translates it, and that translation also acts as a door that only opens from the inside.',
    lab: 'nat',
    labHint: 'Open connections from both devices, reply, then try an unsolicited packet with and without a port forward.',
    simple: [
      'Your home has many devices but usually only one public IP address. When a device sends a packet out, the router swaps the private address for the public one and notes the swap. This is **NAT**, Network Address Translation.',
      'When a reply comes back, the router checks its notes to find which device it belongs to and passes it in.',
      'A packet that arrives without anyone inside asking for it has no matching note, so a **firewall** drops it. That’s why home devices aren’t directly reachable from the internet, unless you set up a **port forward**.',
    ],
    technical: [
      'Typical home routers do NAPT (port address translation): (private IP, private port) ↔ (public IP, public port) entries in a connection-tracking table, with timeouts. Private ranges are defined in RFC 1918 (10/8, 172.16/12, 192.168/16).',
      'NAT is not a security feature by design, but the stateful firewall that accompanies it drops unsolicited inbound traffic. Firewalls can filter on addresses, ports, protocols and connection state.',
      'IPv6 usually doesn’t need NAT, since there are enough addresses for every device; a stateful firewall still blocks unsolicited inbound connections. Carrier-grade NAT (RFC 6598, 100.64/10) adds a second layer of translation at some ISPs.',
    ],
    quiz: [
      {
        question: 'What does NAT change in outgoing packets?',
        options: ['The destination address', 'The source address (and often port)', 'The packet’s content', 'The TTL only'],
        answer: 1,
        explanation: 'The router replaces the private source address and port with its public address and a port it tracks.',
      },
      {
        question: 'A stranger sends a packet to your public IP. With no port forward, what usually happens?',
        options: ['It reaches every device', 'It reaches the laptop', 'The router drops it', 'It is sent back to the stranger'],
        answer: 2,
        explanation: 'There is no NAT entry telling the router which device it is for, and the firewall drops unsolicited inbound traffic.',
      },
      {
        question: 'Why is 192.168.1.23 not usable as an address on the public internet?',
        options: ['It is too short', 'It is a private address reserved for local networks', 'It belongs to Google', 'It is an IPv6 address'],
        answer: 1,
        explanation: '192.168.0.0/16 is a private range (RFC 1918). Millions of homes reuse the same addresses internally.',
      },
    ],
  },
  {
    slug: 'latency-and-packet-loss',
    title: 'Network latency and packet loss',
    summary: 'Why distance and round trips matter more than bandwidth for loading pages.',
    minutes: 6,
    intro: 'A fast connection can still feel slow. Page loads are dominated by round trips, and every round trip costs at least the time light takes to cross the distance.',
    lab: 'latency',
    labHint: 'Move the latency slider and watch every phase stretch. Then add loss.',
    simple: [
      '**Latency** is how long a packet takes to travel. A **round trip** (there and back) is twice that. Even light in fibre needs roughly 55 ms for a round trip between New York and London.',
      'Opening an HTTPS page needs several round trips before the first byte of the page arrives: one for TCP, one for TLS, one for the request. More latency multiplies through all of them.',
      '**Packet loss** forces resending, and the sender only notices after waiting. A little loss can add a lot of delay.',
    ],
    technical: [
      'Time to first byte ≈ DNS + TCP (1 RTT) + TLS 1.3 (1 RTT) + request/response (1 RTT) + server time. TLS 1.2 adds another RTT; HTTP/3 over QUIC merges transport and crypto setup into 1 RTT, and 0-RTT resumption can send the request in the first flight (with replay caveats).',
      'Loss recovery uses fast retransmit (after 3 duplicate ACKs) or the retransmission timeout, which starts at ~3×RTT after the first sample and backs off exponentially. Loss also makes congestion control shrink the sending window.',
      'Bandwidth limits how fast large files transfer once data is flowing; latency limits how quickly small, chatty exchanges complete. CDNs reduce latency by serving content from nearby locations.',
    ],
    quiz: [
      {
        question: 'One-way latency doubles. What happens to the time spent on TCP and TLS handshakes?',
        options: ['Nothing', 'It roughly doubles', 'It halves', 'Only DNS is affected'],
        answer: 1,
        explanation: 'Each handshake costs round trips, and each round trip is twice the one-way latency, so their cost scales with it.',
      },
      {
        question: 'Why can HTTP/3 start faster than HTTP/2 over TLS 1.3?',
        options: [
          'It compresses better',
          'QUIC sets up the transport and encryption in the same round trip',
          'It skips DNS',
          'It does not use encryption',
        ],
        answer: 1,
        explanation: 'TCP+TLS 1.3 needs 2 RTTs before the request; QUIC needs 1 (or 0 when resuming).',
      },
      {
        question: 'Why does a small amount of packet loss cause noticeable delays?',
        options: ['Lost packets are never recovered', 'The sender has to wait for a timeout or duplicate ACKs before resending', 'Routers slow down on purpose', 'DNS has to run again'],
        answer: 1,
        explanation: 'Loss is only detected after a delay. Until the retransmission arrives, everything behind it waits.',
      },
    ],
  },
]

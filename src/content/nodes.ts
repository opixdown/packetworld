import type { NodeId } from '../sim/types'

// What each machine in the journey is, at two levels of detail.

export interface NodeContent {
  role: string
  beginner: string
  technical: string
  analogy?: string
}

export const NODE_CONTENT: Record<NodeId, NodeContent> = {
  client: {
    role: 'Your computer and browser',
    beginner:
      'Where the journey starts. Your browser turns what you typed into a series of questions and requests, and finally draws the page.',
    technical:
      'The client host. It has a private address on your home network (192.168.1.23), runs a stub DNS resolver in the OS, and owns the TCP socket (ephemeral port 52144) and the TLS session.',
    analogy: 'You, writing letters and reading the replies.',
  },
  router: {
    role: 'Home router and the path beyond it',
    beginner:
      'Every packet leaving your home goes through your router. From there it crosses many more routers owned by different networks. Each one only decides the next hop, a bit like passing a parcel between sorting offices.',
    technical:
      'The home router performs NAT (192.168.1.23 → 198.51.100.7) and forwards to your ISP. Beyond it, each router forwards by longest-prefix match in its routing table; inter-network paths are chosen by BGP. The path is not fixed and is not drawn hop by hop here.',
    analogy: 'The post office at the end of your street, and every sorting office after it.',
  },
  resolver: {
    role: 'Recursive DNS resolver',
    beginner:
      'A helper, usually run by your internet provider or a public service, that finds IP addresses for names. It remembers answers so it can reply instantly next time.',
    technical:
      'A recursive resolver (here 192.0.2.53). It accepts recursive queries (RD=1) from stub resolvers, answers from cache when it can, and otherwise resolves iteratively from the root, caching every record by its TTL.',
    analogy: 'A librarian who knows how to find any book, and keeps popular ones on the front desk.',
  },
  root: {
    role: 'Root DNS server',
    beginner:
      'The top of the DNS tree. It doesn’t know website addresses, but it knows who is in charge of each ending like .com or .org. There are 13 root server names, run as more than a thousand copies around the world.',
    technical:
      'One of the 13 root server identities (a–m.root-servers.net), each anycast to many sites. Returns referrals to TLD nameservers. Resolvers cache TLD delegations for two days, so root queries are rare.',
    analogy: 'The library’s floor directory: it tells you which floor, not which book.',
  },
  tld: {
    role: 'Top-level domain (TLD) server',
    beginner:
      'Knows every domain registered under one ending, like .com, and which server holds the real records for each one.',
    technical:
      'Authoritative for the TLD zone. Returns NS referrals (with glue when needed) for delegated domains, or NXDOMAIN when a name is not registered. .com and .net are operated by Verisign; other addresses here are illustrative.',
    analogy: 'The shelf index on the right floor.',
  },
  auth: {
    role: 'Authoritative DNS server',
    beginner: 'The server the domain owner chose to hold the official answer: the actual IP address of the website.',
    technical:
      'Authoritative for the domain’s zone. Answers with AA=1 and the record’s TTL, which controls how long every cache may reuse it. The name and address here are illustrative.',
    analogy: 'The book itself, with the answer written inside.',
  },
  server: {
    role: 'Web server',
    beginner:
      'The computer that holds the website. It listens for connections, proves its identity with a certificate and sends back the page.',
    technical:
      'Listens on TCP 443 (HTTPS) or 80 (HTTP). Address 203.0.113.x is from a documentation range (RFC 5737), derived from the domain name: no real server is contacted. In reality this is often a CDN edge close to you.',
    analogy: 'The shop you came to visit.',
  },
}

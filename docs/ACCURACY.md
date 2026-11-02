# Technical accuracy

PacketWorld is an educational tool, so correctness matters more than flashy animation. This page lists what we promise to get right, every simplification we make on purpose, and how to report a mistake.

## What we never simplify away

| Topic | What PacketWorld shows |
|---|---|
| DNS caching | The full root → TLD → authoritative walk happens only with a cold cache, and the UI says it is the rare worst case. Resolver, OS and browser caches are all modelled. |
| Recursive vs iterative DNS | The stub resolver sends RD=1 to the recursive resolver; the resolver sends RD=0 to the hierarchy. Referrals include glue where needed. |
| Not everything is TCP | DNS runs over UDP. The TCP vs UDP lesson explains UDP and QUIC, and HTTP/3 over QUIC is covered in lessons and the latency lab. |
| TLS version | The main HTTPS example is TLS 1.3: one round trip, key share in the ClientHello, certificate encrypted. TLS 1.2's two round trips are mentioned for comparison. |
| Protocol stacks | HTTPS commonly means HTTP/1.1 or HTTP/2 over TLS over TCP; HTTP/3 means QUIC over UDP. |
| TCP and TLS are separate | Two separate handshakes, shown as two stages, with TLS starting only after TCP is established. |
| Routing | Routers forward hop by hop using their own tables. The internet is drawn as a dashed path, never a fixed chain of routers, and the routing lesson shows paths changing. |
| Encryption and metadata | Every encrypted packet lists what an on-path observer can still see: IPs, ports, sizes, timing, and the SNI hostname unless ECH is used. |
| Consistent numbers | Sequence and acknowledgment numbers, ports, TCP payload sizes and HTTP Content-Length values are consistent across the whole journey. Tests check this for every scenario and under random loss. |
| Simulated vs real | Every diagram is labelled as a simulation. The only real request is the opt-in DNS-over-HTTPS lookup, labelled as real and shown separately ([ADR 0018](decisions/0018-optional-real-dns-lookup.md)). |

## Deliberate simplifications

| Simplification | Why | Where |
|---|---|---|
| Initial sequence numbers are 1000 (client) and 5000 (server) | Real ISNs are random 32-bit numbers (RFC 6528). Small numbers make the arithmetic followable. The UI says so. | [ADR 0010](decisions/0010-readable-sequence-numbers.md) |
| Addresses come from documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) and private ranges | No real machine is implied. The exceptions are a.root-servers.net (198.41.0.4) and a.gtld-servers.net (192.5.6.30) for .com/.net: stable, public, well-known infrastructure. TLD addresses other than .com/.net, nameserver names and certificate issuers are illustrative. | [ADR 0007](decisions/0007-documentation-ip-addresses.md) |
| IPv4 only, A records only | Browsers usually query A and AAAA in parallel and prefer IPv6 when available (Happy Eyeballs). IPv6 is explained in lessons. | [ADR 0008](decisions/0008-ipv4-first.md) |
| Packet addresses are shown as seen at the client's network interface | NAT rewriting is explained in notes on each packet and in the NAT lesson, rather than showing two versions of every packet. | [ADR 0014](decisions/0014-addresses-as-seen-by-the-client.md) |
| The server selects HTTP/1.1 via ALPN | The client offers h2 and http/1.1. HTTP/1.1's text format is readable; many real servers would pick h2. | [ADR 0009](decisions/0009-tls13-and-http11-for-the-main-example.md) |
| Registrable domain = last two labels | We do not use the Public Suffix List, so `example.co.uk` is treated as zone `co.uk`. | `sim/target.ts` |
| One packet drawn per message | Large messages (the certificate, responses) span several TCP segments of at most 1460 bytes. The inspector states how many. | `builder.ts` |
| Pure ACKs are not drawn | Acknowledgment numbers in every packet still reflect what has been received. | `stages/` |
| No TLS middlebox-compatibility ChangeCipherSpec | The client sends an empty `legacy_session_id`, so compatibility mode is not used. | `stages/tls.ts` |
| NewSessionTicket not shown | Servers usually send one or two after the handshake; showing them would add steps without teaching much. | `stages/tls.ts` |
| One stylesheet stands for all sub-resources | Real pages load many scripts, images and fonts. The narration says so. | `stages/http.ts` |
| No bandwidth or congestion window model | Transfer time is latency only. Congestion control is described in text. | `stages/` |
| Random loss capped at 3 losses per packet | So every journey finishes. Stated in the UI. | `builder.ts` |
| Timer values | SYN RTO 1 s and data RTO max(200 ms, 3 × RTT) follow RFC 6298 and Linux; DNS timeouts vary by OS and are labelled as such. | [SIMULATION_MODEL.md](SIMULATION_MODEL.md) |
| Silent server timeout | Linux gives up after 6 SYN retries, about 127 s. We animate three retries and skip the rest of the clock, clearly marked. | `stages/tcp.ts` |
| Certificate validity shown relative to "now" | Avoids hard-coded dates that would go stale. | `stages/tls.ts` |
| Routing lab tables update instantly | Real routing protocols take time to converge; the lab says so. | `sim/routing.ts` |

## Sources

- DNS: RFC 1034, RFC 1035, RFC 2308 (negative caching), RFC 9156 (QNAME minimisation)
- TCP: RFC 9293, RFC 6298 (retransmission timer), RFC 6528 (ISN generation), RFC 7323 (window scaling)
- TLS 1.3: RFC 8446; certificates: RFC 5280
- HTTP semantics: RFC 9110; HTTP/1.1: RFC 9112; HTTP/2: RFC 9113; HTTP/3: RFC 9114; QUIC: RFC 9000
- Addresses: RFC 5737 (documentation IPv4), RFC 3849 (documentation IPv6), RFC 1918 (private), RFC 6598 (shared/CGNAT)

## Reporting a mistake

Open an issue using the **Accuracy report** template. Include what PacketWorld says, what is actually true, and a source (an RFC section, vendor documentation or a packet capture). Accuracy fixes are prioritised over new features.

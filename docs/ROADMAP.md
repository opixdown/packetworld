# Roadmap

PacketWorld is built in phases. The core journey must stay excellent before advanced features are added.

## Phase 1: core journey ✅

- [x] Landing page with a live animated preview
- [x] Network journey visualisation (browser, router, resolver, root, TLD, authoritative, server)
- [x] DNS simulation with five cache levels
- [x] TCP three-way handshake with connection states
- [x] TLS 1.3 handshake with certificate check and lock indicator
- [x] HTTP request and response, sub-resource fetch, page rendering preview
- [x] Play, pause, step forward and back, restart, scrub, speed

## Phase 2: understanding ✅

- [x] Packet inspector with protocol layers and header fields
- [x] Beginner and technical explanations everywhere
- [x] Failure scenarios: NXDOMAIN, lost SYN, lost SYN-ACK, lost ACK, silent server, expired certificate, HTTP 404
- [x] Break the Handshake lab
- [x] Ten lessons with labs and quizzes
- [x] Playground with latency, loss, server time and DNS cache dials
- [x] Shareable playground links

## Phase 2.5: learn more, read less ✅

- [x] "Lab notebook" redesign ([ADR 0017](decisions/0017-lab-notebook-visual-direction.md))
- [x] Guided mode: stop after every step, short explanations, optional extras ([ADR 0019](decisions/0019-guided-mode-and-progressive-disclosure.md))
- [x] Tap any machine or packet for an in-place explainer; clickable glossary words
- [x] Real DNS lookup over HTTPS ([ADR 0018](decisions/0018-optional-real-dns-lookup.md))

## Phase 3: depth (next)

- [ ] **Import a real capture:** drop in a `.pcap` recorded with Wireshark or tcpdump and replay your own packets in the journey view (DNS, TCP, TLS ClientHello/SNI, HTTP where unencrypted)
- [ ] HTTP/2 multiplexing view (several streams on one connection)
- [ ] HTTP/3 and QUIC journey: 1-RTT setup over UDP, 0-RTT resumption
- [ ] IPv6 and Happy Eyeballs (A and AAAA in parallel)
- [ ] TLS 1.2 comparison mode (two round trips side by side)
- [ ] Redirects (301 http → https) and HSTS
- [ ] TCP congestion control and slow start visualisation
- [ ] More certificate failures: wrong hostname, unknown CA, revoked
- [ ] DNS over HTTPS and Encrypted Client Hello: what changes for an observer
- [ ] Packet-level view: real segment boundaries, pure ACKs, SACK blocks
- [ ] Traceroute lesson built on TTL expiry
- [ ] Export a journey as a timeline or a pcap-like text dump

## Phase 4: community

- [ ] Translations (content is already separated from code)
- [ ] Teacher mode: a guided sequence for classrooms
- [ ] Embeddable lesson labs for blogs and courses
- [ ] Contributor-written lessons

Have an idea? Open a feature request. Priorities: accuracy fixes, then accessibility, then new content, then new features.

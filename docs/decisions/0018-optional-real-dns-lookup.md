# 18. Optional real DNS lookup

- **Status:** Accepted (amends [0003](0003-event-based-deterministic-simulation.md) and [0012](0012-no-backend-no-accounts.md))
- **Date:** 2026-11-02

## Context

Learners asked to "make a real request and capture what is really going and coming". A web page cannot capture packets: browsers give pages no access to raw sockets or network interfaces, and even native tools such as Wireshark need administrator rights. Some real data is still reachable from a page.

## Decision

- Add one opt-in real feature: **Look it up for real** on the Journey page. On click, it sends DNS-over-HTTPS (JSON API) queries for the host's A and AAAA records to a public resolver (Cloudflare 1.1.1.1 by default, Google 8.8.8.8 selectable), and shows the real answers, TTLs, CNAME chain, DNSSEC status and round-trip time next to the simulated values.
- Nothing is sent until the learner clicks. The panel states exactly what is sent and who will see the name.
- The core journey stays a deterministic simulation (ADR 0003). The real lookup does not change the simulated journey.
- The network code lives only in `src/live/`; parsing is unit-tested without the network.
- **Real page view:** a second opt-in button loads the real site in a sandboxed `<iframe>` (no scripts, no forms, no referrer), so learners can compare it with the simulated page. Sites that forbid framing show blank; the UI explains why and offers a new-tab link.
- **DevTools guide:** instead of capturing traffic, the panel teaches learners to open their own browser's Network panel and maps its timing columns to PacketWorld's stages.
- Full packet capture is planned as **importing a capture file** (`.pcap` recorded with Wireshark or tcpdump) and replaying it in the visualisation. See the roadmap.

## Consequences

- Learners can compare a pretend address with the real one and see real TTLs and IPv6 records.
- PacketWorld is no longer strictly offline: this one button needs network access and contacts a third party, which is disclosed in the UI and in SECURITY.md.
- The project still has no backend of its own.

## Alternatives considered

- **Real `fetch` timing via the Resource Timing API:** most sites hide detailed timings from other origins (no `Timing-Allow-Origin`), so results would be empty for most URLs.
- **A browser extension or local helper for live capture:** possible later, but it raises the install barrier for students.

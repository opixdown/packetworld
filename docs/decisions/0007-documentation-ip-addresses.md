# 7. Use documentation and private IP addresses

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The simulation shows IP addresses everywhere. Using real addresses would imply that a real server was contacted, could become wrong over time, and could point learners at machines they should not probe.

## Decision

Use RFC 5737 documentation ranges (`192.0.2.0/24` resolver and nameservers, `198.51.100.0/24` the router's public address, `203.0.113.0/24` web servers) and a private RFC 1918 address for the client. The web server address is derived from the domain name with a hash, so each domain gets a stable address. Exception: `a.root-servers.net` (198.41.0.4) and the .com/.net TLD server (192.5.6.30) are real, stable, public infrastructure and teach that these are well-known fixed addresses.

## Consequences

- Nothing shown can be mistaken for a live lookup.
- Addresses are stable across sessions and in tests.
- A learner who looks up example.com for real will see a different address; the UI labels everything as simulated.

## Alternatives considered

- **Live DNS lookups:** non-deterministic and needs network access.
- **Real addresses hard-coded:** go stale and imply real traffic.

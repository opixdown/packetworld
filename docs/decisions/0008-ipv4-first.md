# 8. IPv4 first

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Browsers usually ask for both A (IPv4) and AAAA (IPv6) records and race connections (Happy Eyeballs). Showing both doubles the DNS step and the addresses a beginner must parse.

## Decision

The journey uses IPv4 and A records only. IPv6 is explained in the IP addresses and NAT lessons and listed on the roadmap.

## Consequences

- Simpler first experience.
- Under-represents IPv6, which carries a large share of real traffic. ACCURACY.md says so.

## Alternatives considered

- **IPv6 by default:** accurate for many networks, but long addresses hurt readability for beginners.

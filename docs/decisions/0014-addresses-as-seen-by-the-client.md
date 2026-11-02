# 14. Show addresses as seen by the client

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Packets that cross the home router are rewritten by NAT: on the internet the client's address is 198.51.100.7, not 192.168.1.23. Showing both versions of every packet would double the detail.

## Decision

Packets show addresses as seen at the client's network interface. Each one that crosses the router has a note in its IPv4 layer giving the translated public address and port. The NAT lesson shows the translation explicitly.

## Consequences

- One consistent viewpoint; NAT is still visible where it matters.
- A packet as seen by the server has a different source address than the one shown; the inspector says so.

## Alternatives considered

- **Show the internet view:** confusing, since the learner's own computer would never see its private address.
- **Show both:** accurate but noisy.

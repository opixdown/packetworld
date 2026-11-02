# 13. Seeded, reproducible packet loss

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The Playground lets learners add random packet loss. If loss were truly random, a shared link or a test would show a different journey each time.

## Decision

Loss decisions come from a Mulberry32 generator seeded with a hash of the seed, hostname and loss rate. The Playground has a "roll the dice again" button that changes only the seed. Losses are capped at three per packet so every journey ends.

## Consequences

- Same settings, same journey: links, screenshots and tests are reproducible.
- The cap means extremely lossy networks are under-represented; the UI says so.

## Alternatives considered

- **Math.random():** irreproducible.
- **Fixed loss patterns:** reproducible but predictable and dull.

# 3. Event-based, deterministic simulation

- **Status:** Accepted, amended by [0018](0018-optional-real-dns-lookup.md)
- **Date:** 2026-11-02

## Context

Learners must be able to pause, step backwards, inspect and replay any moment of a journey, and teachers need everyone to see the same thing. Real network requests would be non-deterministic, would require a backend or browser permissions we do not have, and could not show protocol internals anyway.

## Decision

The simulation is a pure function, `buildJourney(config) → Journey`, in `src/sim/`, with no React imports. A journey is an ordered list of events (a packet travelling, or a local action), each carrying narration and patches to a `WorldState`. The UI only plays these events back. All randomness is seeded (ADR 0013).

## Consequences

- Stepping backwards is exact: the world at step *n* is a fold of the first *n* patches.
- The model is unit-tested in Node, independent of the UI.
- Shareable links reproduce a journey exactly.
- Real-world variety (other servers, other timings) is not captured; we document representative values instead.

## Alternatives considered

- **A continuous-time network simulator:** far more realistic, far harder to explain step by step.
- **Recorded packet captures:** real, but fixed and not explorable by changing settings.

# 15. DNS cache modes, with the cold cache as an explicit choice

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Teaching material often shows root → TLD → authoritative as if every lookup did it. In reality most lookups are answered by a cache. But the full walk is the best way to understand how DNS is structured.

## Decision

The journey has five cache modes: cold, resolver knows the TLD, resolver has the answer, OS cache hit, browser cache hit. The Journey page defaults to the cold walk, always shows a note explaining it is the rare worst case, and lets the learner switch in one click. The overview lesson uses the realistic "resolver knows the TLD" mode.

## Consequences

- Learners see the structure and how caching short-circuits it.
- The default journey is not the most common one; the note makes that explicit.

## Alternatives considered

- **Default to a warm cache:** realistic, but hides DNS's structure on first visit.

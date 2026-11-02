# 1. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

PacketWorld is open source and will be changed by people who were not there when it was designed. Many choices (fake addresses, small sequence numbers, a hash router) look odd without their reasons, and a well-meaning contributor could "fix" them.

## Decision

We keep Architecture Decision Records in `docs/decisions/`, one short Markdown file per significant decision, numbered in order. Each has a status, context, decision, consequences and the alternatives considered. A decision is never edited away: a later ADR supersedes it and both stay.

## Consequences

- Reviewers can point to an ADR instead of re-arguing a choice.
- Writing an ADR is a small cost on every significant change.

## Alternatives considered

- **Comments in code only:** too scattered, and decisions often span many files.
- **A wiki:** separates the reasons from the code they explain.

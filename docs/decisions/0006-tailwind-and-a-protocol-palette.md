# 6. Tailwind CSS with a protocol colour palette

- **Status:** Colours and type superseded by [0017](0017-lab-notebook-visual-direction.md)
- **Date:** 2026-11-02

## Context

Every part of the product must share one visual language, where a colour always means the same protocol.

## Decision

Use Tailwind CSS with design tokens in `tailwind.config.js`: `ink-*` surfaces, `fg-*` text and a `proto-*` palette (DNS amber, TCP sky, UDP pink, TLS violet, HTTP emerald, IP slate, error rose, warning orange). The same values are mirrored in `src/lib/protocols.ts` for SVG.

## Consequences

- Consistent colour across map, inspector, timeline, lessons and landing.
- Two places to update when a token changes (documented in DESIGN_SYSTEM.md).

## Alternatives considered

- **CSS modules or styled-components:** more indirection, slower to iterate.
- **A component library:** would make it look like a generic admin dashboard.

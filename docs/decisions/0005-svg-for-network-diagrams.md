# 5. SVG for network diagrams

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Diagrams must be crisp at any size, accessible, clickable and easy to style with the protocol palette.

## Decision

Draw the network map, sequence diagrams and routing lab in SVG with fixed `viewBox`es. Provide separate hand-tuned layouts for wide and tall screens instead of scaling one down.

## Consequences

- Text stays sharp; elements are focusable and labelled for screen readers.
- Two layouts must be maintained when adding a machine.

## Alternatives considered

- **Canvas/WebGL:** better for thousands of objects, which we do not have; worse accessibility.
- **HTML/CSS boxes and lines:** clumsy for diagonal links and paths.

# 16. Use the Stageshow kit for landing illustrations

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The landing page needs a polished, looping preview of packets travelling between a browser and a server. Hand-built marketing animation tends to drift in quality: popping elements, cramped framing, resets with no cause.

## Decision

Vendor the MIT-licensed Stageshow kit into `src/vendor/stageshow/` and use it, following Stageshow's design guidelines (plan, film, review), for marketing illustrations only. The learning simulations do not depend on it. The kit's third-party brand artwork (`brands/`, `BrandMark`) is removed because it carries mixed licenses and is not needed. Local changes are listed in the vendor README.

## Consequences

- A high-quality hero with scale-to-fit, a compact phone layout, a reduced-motion poster and offscreen pausing built in.
- About 300 KB of vendored source in the repository, kept separate from our code.
- Upgrades mean re-copying the kit and re-applying the documented local changes.

## Alternatives considered

- **Hand-built animation with Framer Motion:** fewer files, but we would re-solve framing, loops and reduced motion ourselves.
- **A video or GIF:** heavy, not crisp, not themeable, no reduced-motion story.

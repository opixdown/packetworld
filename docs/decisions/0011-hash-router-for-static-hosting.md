# 11. Hash router for static hosting

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

PacketWorld should be easy to fork and publish, especially on GitHub Pages, which serves from a sub-path and has no server-side rewrites.

## Decision

Use React Router's `createHashRouter` and Vite's `base: './'`. URLs look like `/#/journey?url=…`.

## Consequences

- Works on any static host and from a sub-folder with zero configuration.
- URLs contain a `#`; search engines index only the landing page well. Acceptable for an interactive tool.

## Alternatives considered

- **Browser router plus a 404.html redirect trick:** cleaner URLs, more fragile setup for forks.

# 2. React, TypeScript and Vite

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

We need an interactive, component-heavy front end that many contributors can work on, with type safety for a protocol model full of structured data.

## Decision

Use React 18 with TypeScript (strict mode) and Vite. Tailwind CSS for styling (see ADR 0006), Framer Motion for small UI transitions, lucide-react for icons, Vitest for tests.

## Consequences

- The most familiar stack for front-end contributors.
- Strict types catch mistakes in packet and event structures at compile time.
- Vite gives fast dev reloads and a simple static build.

## Alternatives considered

- **Svelte or Solid:** lighter, but a smaller contributor pool.
- **A canvas or game engine:** better raw performance, but worse accessibility and harder to contribute to.

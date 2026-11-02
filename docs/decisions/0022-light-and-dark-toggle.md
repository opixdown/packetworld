# 22. Light and dark themes with a toggle

- **Status:** Accepted (amends [0021](0021-always-dark-chalkboard-theme.md))
- **Date:** 2026-11-02

## Context

ADR 0021 made the site always dark. The project owner then asked for a simple toggle, and later for every new visitor to start on the light theme.

## Decision

- **Light is the default.** Every visitor starts on the light "lab notebook" palette from ADR 0017. A sun/moon button in the header switches to the dark chalkboard and back. The choice is saved in `localStorage` (`pw.theme.choice`) only when the visitor presses the toggle, so nobody is stuck on a theme they didn't pick.
- Every colour is a CSS variable holding RGB channels (`--pw-paper: 23 22 20`), defined once per theme in `src/index.css` under `:root[data-theme='dark']` and `:root[data-theme='light']`. Tailwind colours read them as `rgb(var(--pw-…) / <alpha-value>)`, so opacity modifiers such as `bg-card/70` still work.
- SVG diagrams and the landing hero use the same variables (`PROTOCOL_COLOR`, `PROTOCOL_TINT` and `PAPER` in `src/lib/protocols.ts` are `rgb(var(--pw-…))` strings), so one attribute on `<html>` switches everything.
- A small inline script in `index.html` applies the saved theme before first paint, so there is no flash of the wrong theme.
- The intro film is always dark, whatever the viewer picked.

## Consequences

- Adding a colour means adding it to both theme blocks.
- No runtime cost: switching themes is a single attribute change.

## Alternatives considered

- **Follow the operating system (`prefers-color-scheme`):** the owner wants light first for everyone, regardless of system settings.
- **Two Tailwind builds or class-based `dark:` variants everywhere:** far more markup to maintain than swapping variable values.

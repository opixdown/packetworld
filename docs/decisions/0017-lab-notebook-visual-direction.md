# 17. "Lab notebook" visual direction

- **Status:** Accepted; colour values superseded by [0021](0021-always-dark-chalkboard-theme.md) (originally superseded the colour and type parts of [0006](0006-tailwind-and-a-protocol-palette.md))
- **Date:** 2026-11-02

## Context

The first design was a dark navy interface with a dot grid, glowing accents and rounded bordered panels everywhere. Feedback from the project owner was that it looked "too AI slop": interchangeable with many generated developer-tool sites. The main audience is students of about 16 (Class 11), for whom a friendly, readable, textbook-like feel matters more than a "hacker" look.

Three directions were presented (lab notebook, transit map, oscilloscope); the owner chose the lab notebook.

## Decision

- **Ground:** warm paper (`#F3EEE4`) with a faint graph-paper grid; dark ink text (`#1D1B17`).
- **Type:** Fraunces (a warm serif) for headings, Atkinson Hyperlegible (designed for readability) for body text, IBM Plex Mono for anything a protocol would print. All self-hosted.
- **Surfaces:** cards with a 1.5px ink border and a flat offset "card on the desk" edge (no blurred shadows, no gradients, no glass).
- **Colour:** each protocol has an ink (text, lines) and a highlighter tint (fills): DNS ochre, TCP blue, UDP magenta, TLS violet, HTTP green. A yellow marker highlight is the one decorative accent.
- **Buttons:** solid ink primary, outlined secondary, both pressing "into" the paper on click.

Token names are semantic (`paper`, `card`, `wash`, `rule`, `fg`, `proto-*`, `tint-*`), so a future theme (for example a dark mode) can change values without renaming classes.

## Consequences

- The product looks deliberately designed and distinct, and reads well for long explanations.
- Light-only for now; a dark theme would need a second set of token values.
- Protocol inks are darker than the old neon accents to keep text contrast at WCAG AA on paper.

## Alternatives considered

- **Transit map:** bold and graphic, but harder to fit dense explanations into.
- **Oscilloscope (dark, phosphor):** distinctive, but closer to the original dark look and less approachable for beginners.

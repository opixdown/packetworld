# 21. Always-dark "chalkboard" theme

- **Status:** Accepted, amended by [0022](0022-light-and-dark-toggle.md) (a light theme is now available via a toggle); supersedes the colour values of [0017](0017-lab-notebook-visual-direction.md)
- **Date:** 2026-11-02

## Context

The project owner wants the whole site to be dark, always, with no option to switch to light. The earlier dark design was rejected for looking generic (navy, glows, rounded panels), so the new dark theme must keep the hand-made character of the "lab notebook" direction.

## Decision

- One theme only: a warm **chalkboard**. No light mode and no toggle; `color-scheme: dark`.
- Keep everything from ADR 0017 except colour values: the same fonts (Fraunces, Atkinson Hyperlegible, IBM Plex Mono), flat offset-edge cards, highlighter accents, protocol inks and tints.
- New values: board `#171614`, cards `#22201C`, chalk text `#EFE9DC`, card outlines and offset edges in a separate `edge` colour (`#6E675C`), so outlines are soft while text stays bright.
- Protocol inks become coloured chalk (DNS `#F2B84B`, TCP `#6CB4F0`, TLS `#B79CF5`, HTTP `#5FCB8C`, error `#F2735F`), and tints become deep, dark versions of the same hues.
- Pages drawn inside the product (the browser preview, the landing hero's page, the intro film) are dark too, so the whole site is dark. The only exception is the real website loaded in the "Real page" frame, which looks however that site looks.

## Consequences

- One palette to maintain; semantic token names (`paper`, `card`, `edge`, `fg`, `proto-*`, `tint-*`) meant the switch was mostly a value change.
- Students who prefer light pages can't switch. A light theme could return later as a second set of token values.

## Alternatives considered

- **Dark by default with a light toggle:** more flexible, but the owner asked for dark only.
- **Return to the original navy design:** rejected earlier as generic.

# Design system: "Lab notebook" on a chalkboard

PacketWorld looks like a well-kept science notebook. It opens on light paper and ink; a sun/moon toggle in the header switches to a dark chalkboard (a warm dark board, chalk-white text, coloured chalk) ([ADR 0022](decisions/0022-light-and-dark-toggle.md)). It is built for students of about 16 who are meeting networking for the first time. The reasoning is in [ADR 0017](decisions/0017-lab-notebook-visual-direction.md) and [ADR 0021](decisions/0021-always-dark-chalkboard-theme.md); the learning interactions are in [ADR 0019](decisions/0019-guided-mode-and-progressive-disclosure.md).

## Principles

1. **The simulation is the hero.** The network map and the step card get the space; everything else supports them.
2. **Learn more, read less.** One or two sentences by default. Details open on request. Anything on screen can be tapped to learn what it is.
3. **Colour means protocol.** Marker colours are reserved for protocols and status. Everything else is paper and ink.
4. **Made by hand, not generated.** Ink borders, flat offset edges, a serif with character. No glows, gradients, glass or blurred shadows.
5. **Readable first.** A legibility-focused body font, generous line height, WCAG AA contrast, 44px touch targets.

## Colour

### Board and chalk

| Token (Tailwind) | Hex | Use |
|---|---|---|
| `paper` | `#171614` | Page background (with the faint grid) |
| `paper-2` | `#100F0D` | Alternate bands |
| `card` | `#22201C` | Cards, panels |
| `wash` | `#2C2A25` | Hover fills, icon tiles |
| `rule` / `rule-strong` | `#3A372F` / `#57524A` | Dividers, inactive lines |
| `edge` | `#6E675C` | Card outlines and their flat offset edge |
| `fg` | `#EFE9DC` | Chalk: text, primary buttons |
| `fg-muted` | `#B5AD9E` | Body copy |
| `fg-faint` | `#8E8677` | Metadata only |

### Protocol chalks and tints

Every protocol has a **chalk** colour (`proto-*`, for text and lines) and a deep **tint** (`tint-*`, for fills). They are used the same way on the map, in the step card, the inspector, the timeline, lessons and the landing page.

| Protocol | Chalk | Tint |
|---|---|---|
| DNS | `#F2B84B` | `#3B2F15` |
| TCP | `#6CB4F0` | `#16304A` |
| UDP / QUIC | `#F07AB0` | `#3F1C2E` |
| TLS | `#B79CF5` | `#2C2246` |
| HTTP (and success) | `#5FCB8C` | `#173826` |
| IP / routing | `#A8B0BC` | `#2A2D33` |
| Error | `#F2735F` | `#45201A` |
| Warning | `#F59E4B` | `#432C14` |

`tint-marker` (`#4D4213`) fills hover states on clickable words and the first-visit tip; the `.pw-mark` highlighter swipe uses translucent yellow chalk.

Pages drawn inside the product (browser preview, landing hero, intro film) are dark too. Only the real website loaded in the "Real page" frame keeps its own colours.

The tables show the dark values. The light theme uses the paper-and-ink values from [ADR 0017](decisions/0017-lab-notebook-visual-direction.md). All values are CSS variables in `src/index.css` (one block per theme); Tailwind and the SVG helpers in `src/lib/protocols.ts` read the same variables, so there is nothing to keep in sync by hand.

## Typography

| Role | Font | Notes |
|---|---|---|
| Headings | **Fraunces Variable** (`font-display`) | Applied to `h1`–`h3` automatically. Italic for small captions on the map. |
| Body and UI | **Atkinson Hyperlegible** (`font-sans`) | Designed by the Braille Institute for legibility. Weights 400 and 700 only. |
| Protocol data | **IBM Plex Mono** (`font-mono`) | Packet labels, addresses, ports, fields, step counters. Never for ordinary labels. |

All fonts are self-hosted via `@fontsource`; no third-party font requests.

## Surfaces and shapes

- **Card:** `rounded-md border-[1.5px] border-edge bg-card`, optionally `shadow-note` (a flat 3px offset edge, no blur).
- **Buttons:** `.pw-btn-primary` (chalk fill, dark text) and `.pw-btn-secondary` (card with an edge outline). Both have the offset edge and press into the paper on click.
- **Map machines:** index cards with an edge outline, an offset edge and an ⓘ marker in the corner. When active they fill with the stage's tint.
- **Packets:** tags filled with the protocol tint, outlined in its ink, with a small offset edge. Lock glyph when encrypted, dashed outline when retransmitted, struck through when lost.
- **Captions on the map:** chalk-white "sticky notes" with a pointer.
- Radius: 4–6px. Nothing pill-shaped except toggles and explanation chips.

## Learning patterns

| Pattern | Component | Rule |
|---|---|---|
| Step card | `StepCard` | Title + 1–2 sentences + "Watch:" line. Extras behind "Why?", "Real-life example", "Technical detail". Back/Next always visible. |
| Guided mode | `usePlayback` | Default on: stop after every step. The Autoplay switch turns it off. |
| Tap to learn | `MapExplainer`, `Bubble` | Tapping a machine or packet opens a small bubble next to it with 1–2 sentences and a link to full details. |
| Clickable words | `TermText`, `content/glossary.ts` | At most 3 underlined terms per text, rarer words first. One-sentence definitions. |
| First-visit tip | `JourneyPlayer` | Shown once, dismissed on first tap. |

## Motion

- Packets travel with an ease-in-out curve, 0.95–1.7 s at 1×. In guided mode they stop on arrival.
- UI feedback (hover, press, toggles) is 150ms or less. Bubbles fade up in 300ms.
- `prefers-reduced-motion` shortens CSS animation to near zero; the landing hero shows its still poster.

## Layout

- Max width 1280px, 16px gutters on phones, 24px from `sm`.
- Journey and Playground: map and controls on the left, step card and browser preview on the right (stacked below `lg`), inspector and step list underneath.
- Playground order: experiments → dials and result → simulation → timing.
- The map has a separate tall layout below 640px.

## Accessibility

- Machines, packets, clickable words and bubbles are keyboard reachable (`role="button"`, Enter/Space), and bubbles close with Escape.
- The step card is an `aria-live="polite"` region.
- Shortcuts: Space (play/next), ← and → (step), ignored while typing or inside a bubble.
- Focus ring: 2.5px sky-blue outline.
- Colour is never the only signal: packets have text labels, states are written out, lost packets are struck through and labelled.
- Effects always use block bodies. Newer browsers return Promises from APIs such as `scrollTo`, and a returned value would be treated as a cleanup function.

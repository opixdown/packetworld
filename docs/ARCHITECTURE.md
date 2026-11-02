# Architecture

PacketWorld is a static single-page application. There is no backend: every journey is computed in the browser from a small configuration object.

## Layers

```
┌───────────────────────────────────────────────────────────────┐
│ pages/            Landing · Journey · Playground · Learn       │  routing, page layout
├───────────────────────────────────────────────────────────────┤
│ components/       JourneyPlayer, SequencePlayer, labs/…        │  composition
│                   NetworkCanvas, Packet, NetworkNode,          │  visual building blocks
│                   PacketInspector, ExplanationPanel,           │
│                   SimulationControls, ProtocolTimeline, Quiz   │
├───────────────────────────────────────────────────────────────┤
│ hooks/usePlayback  play · pause · step · seek · speed          │  animation clock
├───────────────────────────────────────────────────────────────┤
│ sim/              buildJourney(config) → Journey               │  pure protocol logic
│                   stages/dns · tcp · tls · http                │  no React, fully tested
├───────────────────────────────────────────────────────────────┤
│ content/          lessons, quizzes, experiments, node texts    │  words, kept out of code
└───────────────────────────────────────────────────────────────┘
```

The optional real lookup lives in `src/live/` and is used only by `LiveDnsPanel` ([ADR 0018](decisions/0018-optional-real-dns-lookup.md)).

Dependencies only point downwards. `sim/` imports nothing from the UI, which keeps it testable in Node and reusable (for example in a future CLI or a different front end).

## Data flow

1. A page builds a `JourneyConfig` (URL, DNS cache mode, failure scenario, latency, loss, server time, seed). The Journey and Playground pages keep it in the URL query string, so every setup is shareable.
2. `buildJourney(config)` parses the URL into a `Target`, then runs the stage builders in protocol order. Each builder appends `SimEvent`s to a `JourneyBuilder`, which keeps the simulated clock and the seeded random generator.
3. The result is a `Journey`: the events, the span of each stage, the outcome, and the initial `WorldState`.
4. `usePlayback(events, initial)` drives an animation clock with `requestAnimationFrame`. It exposes the current event index, its 0–1 progress, and the `WorldState` at that moment, folded from each event's `onStart` and `onEnd` patches.
5. Components render from that: `NetworkCanvas` draws machines, links and the packet in flight; `PacketInspector` shows the selected packet's layers; `ExplanationPanel` narrates; `BrowserPreview` shows what the user would see.

`sliceJourney(journey, stages)` cuts a journey down to some stages, with the right starting world, for lessons that focus on one protocol.

## Key modules

| Module | Responsibility |
|---|---|
| `sim/types.ts` | `SimEvent`, `Packet`, `Layer`, `WorldState`, `Journey` |
| `sim/config.ts` | `JourneyConfig`, defaults, cache modes and scenarios |
| `sim/target.ts` | URL parsing and the deterministic, documentation-range server address |
| `sim/topology.ts` | Simulated addresses, ports and one-way latencies |
| `sim/builder.ts` | `JourneyBuilder` (clock, loss, retransmission) and header-layer helpers |
| `sim/stages/*.ts` | One file per protocol stage |
| `sim/journey.ts` | `buildJourney`, `sliceJourney`, world-state folding |
| `sim/timing.ts` | Waterfall summary (DNS, TCP, TLS, TTFB, …) |
| `sim/routing.ts` | Link-state routing model for the routing lesson |
| `hooks/usePlayback.ts` | Playback clock, independent of simulated time |
| `components/network/*` | SVG canvas, layouts (wide and tall), nodes, links, packets |
| `components/SequenceDiagram.tsx` | Ladder diagram used by the handshake lessons |
| `components/StepCard.tsx` | Short per-step explanation with optional extras and Back/Next |
| `components/MapExplainer.tsx`, `Bubble.tsx` | Tap-to-learn bubbles anchored to machines and packets |
| `components/TermText.tsx`, `content/glossary.ts` | Clickable key words with one-line definitions |
| `live/doh.ts`, `components/LiveDnsPanel.tsx` | Opt-in real DNS lookup over HTTPS |

## Two clocks

Simulated time (`event.t`, `event.duration`) is what the protocols experience: 30 ms of latency, a 1 s retransmission timer. Playback time is what the learner experiences: every step needs to be watchable, whether it represents 0.1 ms or 60 s. `usePlayback` maps each event to a readable animation length and shows simulated time separately (`t = …` in the controls). See [ADR 0004](decisions/0004-own-playback-clock.md).

## State

- **Journey config** lives in the URL query string (Journey, Playground).
- **Playback state** is local to each player (`usePlayback`). Guided vs autoplay is remembered in `localStorage`.
- **Explanation mode** (beginner or technical) is a React context, persisted to `localStorage`.
- **Lesson progress** is persisted to `localStorage`.
- All storage access is wrapped in `try/catch`; the app works without it.

## Rendering

Diagrams are SVG with a fixed `viewBox`, so they scale crisply. The network map has two hand-tuned layouts, wide for desktop and tall for phones (`components/network/layout.ts`), because shrinking the desktop layout would make labels unreadable. See [ADR 0005](decisions/0005-svg-for-network-diagrams.md).

## The landing hero

The landing animation is a separate, self-contained illustration in `src/landing/`, built with the vendored [Stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow) kit. It is a marketing illustration, not part of the simulation; its design notes are in [design/LANDING_HERO.md](design/LANDING_HERO.md) and the choice is recorded in [ADR 0016](decisions/0016-stageshow-kit-for-landing-illustrations.md).

## Testing

`src/sim/*.test.ts` (Vitest, Node environment) checks the properties that matter for correctness: sequence and acknowledgment numbers continue correctly in every scenario and under random loss; DNS cache modes skip the right servers; failure scenarios end in the right state; plain HTTP skips TLS; Content-Length matches the body; timing scales with round trips. Run `npm test`.

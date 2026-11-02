# 4. Our own playback clock instead of animation-library timelines

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Simulated times range from 0.1 ms (a cache lookup) to 127 s (a TCP connect timeout). Playing them in real time would be unwatchable, and scaling them linearly would make DNS invisible. We also need exact pause, seek, single-step and speed control.

## Decision

`usePlayback` runs a `requestAnimationFrame` clock that gives each event a readable animation length (packets 0.95–1.7 s, mildly longer for longer simulated trips; local steps 0.7–1.1 s) followed by a short dwell. Simulated time is shown separately (`t = …`). Components render from `(index, progress)`; Framer Motion is used only for small UI transitions.

## Consequences

- Pause, seek and step are trivial and exact.
- Animation length no longer tells the learner how long something really took; the timeline, the `t =` readout and the waterfall do.

## Alternatives considered

- **Framer Motion or GSAP timelines:** good for fixed choreography, awkward for seeking to arbitrary steps and syncing with derived state.
- **Real-time playback:** honest, unwatchable.

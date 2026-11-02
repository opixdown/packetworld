# 19. Guided mode and "learn more, read less"

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Learners need time to understand each step, but long explanations next to a moving animation get skipped. The project owner asked for people to "learn more and read less": short text by default, with details one click away, and the ability to tap anything on screen to find out what it is.

## Decision

- **Guided mode is the default.** Playback stops after every step. A step card shows the step's title and one or two sentences, a "Watch:" line telling the learner what to look at, and **Back / Next** buttons. An **Autoplay** switch restores continuous playback; the choice is remembered.
- **Progressive disclosure.** "Why?", "Real-life example" and "Technical detail" open only on request.
- **Tap to learn.** Every machine has an ⓘ marker. Tapping a machine or a packet opens a small explainer bubble right next to it, with a link to the full inspector.
- **Clickable words.** Key terms in explanations are underlined (at most three per sentence, rarer words first); tapping one shows a one-line definition from `src/content/glossary.ts`.
- A one-time tip on the map tells new visitors that everything is tappable.

## Consequences

- Beginners control the pace and are never forced to read a wall of text.
- Every local simulation step can carry optional `why` and `analogy` text, which content authors should fill in.
- Watching the whole journey takes more clicks; Autoplay covers that case.

## Alternatives considered

- **Autoplay with a pause button:** learners rarely pause in time.
- **Pausing only at key moments:** less control, and the choice of "key moments" would be arbitrary.

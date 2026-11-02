# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Guided mode (default): the simulation stops after every step with a short explanation, a "Watch:" hint and Back/Next buttons; Autoplay switch for continuous playback.
- Tap any machine or packet on the map to open a small explainer bubble; every machine has an ⓘ marker.
- Clickable key words with one-line definitions (glossary of 40 terms).
- "Try it for real": an opt-in DNS-over-HTTPS lookup showing a site's real A/AAAA records, TTLs, CNAME chain and DNSSEC status.
- Hosting on Vercel (https://packetworld.vercel.app) with automatic deploys from GitHub; `vercel.json`.
- Screenshots in the README.
- "Now try it for real" panel with three tabs: real DNS lookup, the real page loaded in a sandboxed frame, and a guide to seeing every request in your own browser's DevTools, mapped to PacketWorld's stages.
- Simulated example.com text now matches the real page.
- ADRs 0017–0022.
- An intro film (`#/promo/intro`): a tour of the website including the lessons and quizzes, with an original soundtrack composed in code (`scripts/compose-music.mjs`) and a frame-exact renderer (`scripts/render-intro.mjs`).

### Changed

- The site is dark by default: a warm "chalkboard" version of the notebook design (ADR 0021), with a sun/moon toggle for the light theme (ADR 0022).
- New "lab notebook" visual design: paper and ink, Fraunces / Atkinson Hyperlegible / IBM Plex Mono, protocol inks and highlighter tints.
- Playground: experiments and dials moved to the top, followed by the simulation and then the timing.
- Lesson labs use the same step card and tap-to-learn bubbles.

### Fixed

- "destroy is not a function" crash on navigation in browsers where `window.scrollTo` returns a Promise.

## [0.1.0] - 2026-11-02

### Added

- Deterministic, event-based protocol simulation: DNS (five cache levels), the TCP three-way handshake, TLS 1.3 and HTTP/1.1, with consistent ports, sequence numbers and sizes.
- Failure scenarios: NXDOMAIN, lost SYN, lost SYN-ACK, lost final ACK, unresponsive server, expired certificate, HTTP 404; seeded random packet loss; configurable latency and server time.
- Journey page: animated network map with play, pause, step, scrub, speed and keyboard shortcuts; packet inspector with protocol layers; beginner and technical explanations; browser preview.
- Playground with eight guided experiments, a timing waterfall and shareable links.
- Ten interactive lessons with labs and quizzes; progress saved locally.
- Landing page with an animated hero built on the vendored Stageshow kit.
- Documentation: architecture, simulation model, accuracy notes, design system, content guide, roadmap, deployment, and 16 architecture decision records.
- CI (typecheck, tests, build) and a GitHub Pages deployment workflow.

# Contributing to PacketWorld

Thanks for helping people understand the internet. All kinds of contributions are welcome: accuracy fixes, lessons, translations, accessibility, design and code.

## Ground rules

1. **Accuracy first.** If a change makes something look better but less true, it does not go in. Every simplification must be listed in [docs/ACCURACY.md](docs/ACCURACY.md).
2. **Both voices.** Anything a learner reads needs a beginner and a technical version. See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).
3. **Keep the layers apart.** Protocol logic goes in `src/sim/` with no React imports; UI goes in `src/components/` and `src/pages/`. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
4. **Record big decisions.** If your change makes a significant architectural or educational choice, add an ADR in [docs/decisions/](docs/decisions/README.md).

## Getting started

```sh
git clone https://github.com/opixdown/packetworld.git
cd packetworld
npm install
npm run dev
```

Before opening a pull request:

```sh
npm run typecheck
npm test
npm run build
```

CI runs the same three commands.

## What to work on

- Issues labelled **good first issue** or **accuracy**.
- Items in [docs/ROADMAP.md](docs/ROADMAP.md). Comment on the issue first for anything large, so work isn't duplicated.

## Reporting a technical mistake

Use the **Accuracy report** issue template. Tell us what PacketWorld says, what is actually true, and link a source (an RFC section, documentation, or a packet capture). These are the most valuable issues we get.

## Changing the simulation

- Read [docs/SIMULATION_MODEL.md](docs/SIMULATION_MODEL.md).
- Build packets with the helpers in `src/sim/builder.ts` and `src/sim/stages/segment.ts` so header fields stay consistent.
- Add or update tests in `src/sim/*.test.ts`. The sequence-number checker runs on every scenario, so you get consistency checks for free.

## Code style

- TypeScript strict mode, functional React components and hooks.
- Match the surrounding code: naming, comment density and idioms. Comments explain *why*, not *what*.
- Prettier settings are in `.prettierrc` (no semicolons, single quotes, 110 columns).
- Use the design tokens (`ink-*`, `fg-*`, `proto-*`); don't introduce new colours without updating [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- `src/vendor/` is third-party code. Don't edit it except as described in its README.

## Pull requests

- One topic per pull request, with a clear description and screenshots for visual changes (desktop and phone width).
- Link the issue it closes.
- Expect review comments about accuracy and wording; they are about the learners, not about you.

## Code of conduct

By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

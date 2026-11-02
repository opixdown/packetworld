# Architecture Decision Records

Why PacketWorld is built the way it is. Format and process: [ADR 0001](0001-record-architecture-decisions.md).

| # | Decision | Status |
|---|---|---|
| 0001 | [Record architecture decisions](0001-record-architecture-decisions.md) | Accepted |
| 0002 | [React, TypeScript and Vite](0002-react-typescript-vite.md) | Accepted |
| 0003 | [Event-based, deterministic simulation](0003-event-based-deterministic-simulation.md) | Accepted, amended by 0018 |
| 0004 | [Our own playback clock instead of animation-library timelines](0004-own-playback-clock.md) | Accepted |
| 0005 | [SVG for network diagrams](0005-svg-for-network-diagrams.md) | Accepted |
| 0006 | [Tailwind CSS with a protocol colour palette](0006-tailwind-and-a-protocol-palette.md) | Colours and type superseded by 0017 |
| 0007 | [Use documentation and private IP addresses](0007-documentation-ip-addresses.md) | Accepted |
| 0008 | [IPv4 first](0008-ipv4-first.md) | Accepted |
| 0009 | [TLS 1.3 with HTTP/1.1 for the main example](0009-tls13-and-http11-for-the-main-example.md) | Accepted |
| 0010 | [Readable initial sequence numbers](0010-readable-sequence-numbers.md) | Accepted |
| 0011 | [Hash router for static hosting](0011-hash-router-for-static-hosting.md) | Accepted |
| 0012 | [No backend and no accounts](0012-no-backend-no-accounts.md) | Accepted, amended by 0018 |
| 0013 | [Seeded, reproducible packet loss](0013-seeded-packet-loss.md) | Accepted |
| 0014 | [Show addresses as seen by the client](0014-addresses-as-seen-by-the-client.md) | Accepted |
| 0015 | [DNS cache modes, with the cold cache as an explicit choice](0015-dns-cache-modes.md) | Accepted |
| 0016 | [Use the Stageshow kit for landing illustrations](0016-stageshow-kit-for-landing-illustrations.md) | Accepted |
| 0017 | ["Lab notebook" visual direction](0017-lab-notebook-visual-direction.md) | Colour values superseded by 0021 |
| 0018 | [Optional real DNS lookup](0018-optional-real-dns-lookup.md) | Accepted |
| 0019 | [Guided mode and "learn more, read less"](0019-guided-mode-and-progressive-disclosure.md) | Accepted |
| 0020 | [Host on Vercel](0020-host-on-vercel.md) | Accepted |
| 0021 | [Always-dark "chalkboard" theme](0021-always-dark-chalkboard-theme.md) | Amended by 0022 |
| 0022 | [Light and dark themes with a toggle](0022-light-and-dark-toggle.md) | Accepted |

## Writing a new ADR

1. Copy [template.md](template.md) to the next number, e.g. `0023-short-title.md`.
2. Fill in context, decision, consequences and alternatives. Keep it to one page.
3. Add it to the table above in the same pull request as the change it describes.
4. To reverse a decision, write a new ADR that supersedes the old one and set the old one's status to `Superseded by NNNN`.

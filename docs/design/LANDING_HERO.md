# Landing hero: plan and rehearsal notes

The landing page's live preview (`src/landing/HeroStage.tsx`, `hero.css`) was designed following the [Stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow) design guidelines and built on its kit (vendored in `src/vendor/stageshow`). This file records the plan written before any code, and the review afterwards, as those guidelines recommend.

## Plan

| | |
|---|---|
| **Medium** | Looping animation, about 13 s, beside the headline on the landing page. |
| **Size** | 720 × 400 wide; a redesigned 358 × 530 compact layout below 600 px. |
| **Ground** | The page is the ground: transparent stage, no plate. |
| **Look** | Kit light theme with PacketWorld's "lab notebook" tokens: paper, ink outlines with flat offset edges, packets as highlighter tags in protocol colours (originally dark navy; restyled with [ADR 0017](../decisions/0017-lab-notebook-visual-direction.md)). |
| **Focal object** | The browser window: the page it shows is the payoff. |
| **Satellites** | A small DNS resolver chip and a larger server card, tied to the browser by wires that end in dots. Two different kinds, not a stack. |
| **Story shape** | "What the system does": no cursor. Each packet's consequence lands on the server card. |
| **Real strings** | The domain, "Example Domain", the paragraph, "DNS resolver", "Server", the IP, three status values, packet labels. Everything else is placeholder bars. |
| **Left out** | Root, TLD and authoritative servers; pure ACKs; certificate details. The Journey page has those. |

### Beats

1. The domain is typed into the address bar; Enter (keycap); the page drops to its skeleton.
2. `DNS query` goes to the resolver; the answer (the IP) returns and lands as the server's address.
3. `SYN`, `SYN-ACK`, `ACK`; the TCP row reads **Established**.
4. `Client Hello`, `Server Hello`; the TLS row reads **1.3 · encrypted** and the lock opens its space in the address bar.
5. `GET /` and `200 OK` (with lock glyphs, since they travel inside TLS); the HTTP row reads **200 OK** and the page resolves top to bottom.
6. Hold 2.4 s, then the address bar clears and everything the loop added leaves together.

### Accuracy in a loop

A looping hero that re-loads the same domain would be dishonest: a second visit would be answered from a DNS cache. Each loop types a different documentation domain (example.com, example.org, example.net), and the IPs match what the Journey simulation gives each name.

### Poster

The finished state for example.com: page rendered, lock shown, all three rows filled. It tells the whole story on its own, and is what reduced-motion users and thumbnails see.

## Rehearsal

Filmed with headless Chromium at 1440 px (contact sheet of 7 frames) and at 390 px (3 frames), plus the reduced-motion poster.

| Fault found | Fix |
|---|---|
| A fade-crop at the window's foot turned the light page into a muddy grey band over the (then dark) ground | The window is whole and inset by the gutter |
| Packets centred on the lane ends, so arriving pills covered the resolver and server cards | Packets now leave with their back edge on the browser and dock with their front edge on the machine |
| Lanes of 140 px gave long labels almost no travel | Window narrowed to 304 px; lanes are 192 px |
| The server IP crowded the card's right edge | IP stacked under "Server", matching the Journey map's node style |
| A void under the page content while loading | Placeholder lines are part of the skeleton too |
| Compact layout clipped the bottom of the server card | Compact stage height raised to 530 |

### Not checked

- Stageshow's `film.mjs --gate` check was not run: it needs a local Chrome install, and the frames were reviewed by eye from Playwright's Chromium instead.
- Behaviour at speeds other than 1×, and the loop seam at frame-level (60 ms) resolution.

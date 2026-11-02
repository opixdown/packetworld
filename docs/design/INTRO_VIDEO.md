# Intro film: plan and notes

A 41-second film for social media (made for X): a guided tour of the real website, with the live journey animation in the middle, the learning section, and an original soundtrack. Source: `src/promo/IntroVideo.tsx` (open `#/promo/intro` to preview it in a loop). Renderer: `scripts/render-intro.mjs`.

## Plan

| | |
|---|---|
| **Format** | 1920 × 1080, 30 fps, 41.4 s, H.264 MP4 with AAC stereo audio (yuv420p, `+faststart`): X's recommended upload format |
| **Look** | The site's own chalkboard design. Website scenes use real screenshots of the site (`scripts/capture-promo-shots.mjs`, which also measures every button the cursor clicks); the journey scene uses the real `NetworkCanvas` component |
| **Sound** | An original track composed in code (`scripts/compose-music.mjs`): royalty-free, about 96 BPM, Fmaj7 → G6 → Em7 → Am7. Its sections follow the film (pad for the hook; bass and kick for the tour; hats, claps and arpeggio for the journey; a ringing Cmaj9 for the end card), with whooshes on scene changes and a click on every cursor press. Every beat still reads on mute. |
| **Motion** | Eased with the Stageshow kit's curves: `settle` for arrivals, `through` for exits, `house` for the highlighter and strike-through |

### Beats

| Time | Scene | What happens |
|---|---|---|
| 0–3.9 s | Hook | "The internet is not magic." tag drops in; the headline rises word by word; a highlighter sweeps under *seen*. |
| 3.9–10.2 s | Website tour | A browser window at packetworld.vercel.app rises in. The real landing page scrolls to the four stages and back; the cursor clicks **Explore the Internet**; the Journey page loads and the camera pushes into the map. |
| 10.2–21.4 s | Live journey | The real network map plays 18 packets: DNS walks root → .com → authoritative, the TCP handshake, TLS 1.3, `GET /` and `200 OK`. A large caption names each stage; the page appears as the payoff. |
| 21.4–24.4 s | Tap to learn | Back in the browser window: the cursor taps the DNS resolver and its explainer bubble opens. |
| 24.4–30.8 s | Learn | The lesson list; the cursor opens *TCP three-way handshake*; the lesson breaks the handshake; a quiz question is answered correctly. |
| 30.8–37.0 s | Playground and real | The cursor clicks **SYN lost** in the Playground, then **Look it up for real**, and the real answer appears. A caption names each feature. |
| 37.0–41.4 s | End card | Logo, PacketWorld, the tagline, **packetworld.vercel.app**, free and open source. |

## How it renders

Everything on screen is a pure function of the time `t`. In record mode (`#/promo/intro?record=1`) the page installs the Stageshow kit's virtual clock before React starts, and the film waits for a `pw-start` event. The renderer:

1. opens the page at 1920 × 1080 in headless Chromium,
2. waits (polling from Node, since page timers are frozen) until fonts and every screenshot are loaded,
3. steps the clock by exactly 1/30 s, takes a PNG screenshot, and pipes it to ffmpeg,
4. encodes with libx264 at CRF 16.

Every frame is exact and the render is repeatable.

```sh
npm install --no-save playwright ffmpeg-static
npx playwright install chromium
npm run dev
node scripts/capture-promo-shots.mjs   # refresh the website screenshots
node scripts/compose-music.mjs track.wav
MUSIC=track.wav node scripts/render-intro.mjs http://localhost:5173/#/promo/intro?record=1 packetworld-intro.mp4
```

## Review

Stills were rendered at key moments and reviewed as a contact sheet before the full render.

| Fault found | Fix |
|---|---|
| The headline broke after "every" | Smaller type; each line kept whole |
| The payoff page never appeared: the packets overran into the next scene | Tighter packet timing; the CSS response is skipped |
| The map was small in the frame | Widened to 1500 px |
| The lesson screenshot hid its heading under the sticky header | Captured with more top margin |
| The tour window's bottom edge left the frame | Window raised 8 px |

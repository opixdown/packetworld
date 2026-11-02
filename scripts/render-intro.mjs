// Renders the intro film (#/promo/intro) to an MP4, frame by frame.
//
//   npm install --no-save playwright ffmpeg-static
//   npx playwright install chromium
//   npm run dev                       # in another terminal
//   node scripts/render-intro.mjs [url] [out.mp4]
//
// STILLS=1,5.5,12 node scripts/render-intro.mjs   writes PNG stills instead.
// MUSIC=track.wav node scripts/render-intro.mjs     adds a soundtrack
//   (make one with: node scripts/compose-music.mjs track.wav).
//
// The page installs a virtual clock in record mode, so every frame is exact:
// the recorder advances time by 1/30 s, waits for React to commit, then
// takes the screenshot. See docs/design/INTRO_VIDEO.md.
import { spawn } from 'node:child_process'
import { renameSync } from 'node:fs'
import ffmpeg from 'ffmpeg-static'
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5173/#/promo/intro?record=1'
const out = process.argv[3] ?? 'packetworld-intro.mp4'
const FPS = 30
const DURATION = 41.4
const stills = process.env.STILLS?.split(',').map(Number)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
page.on('pageerror', (e) => console.error('page error:', e.message))
await page.goto(url, { waitUntil: 'load' })
// Poll from Node: inside the page, timers and animation frames are frozen
// until the clock is stepped.
for (let i = 0; ; i++) {
  const ready = await page.evaluate(() => !!window.__clock && window.__filmReady === true && !!document.querySelector('h1'))
  if (ready) break
  if (i % 10 === 0) await page.evaluate(() => window.__clock?.step(1))
  if (i > 300) throw new Error('The film page did not become ready.')
  await new Promise((r) => setTimeout(r, 100))
}
await page.evaluate(async () => {
  await document.fonts.ready
  await window.__clock.settle()
  window.dispatchEvent(new Event('pw-start'))
})

const step = () =>
  page.evaluate(async () => {
    // Only the clock's own methods: page timers are frozen between steps.
    await window.__clock.step(1)
    await window.__clock.settle()
  })

const total = Math.round(FPS * DURATION)
if (stills) {
  let frame = 0
  for (const s of stills.sort((a, b) => a - b)) {
    const target = Math.round(s * FPS)
    while (frame < target) {
      await step()
      frame++
    }
    await page.screenshot({ path: `still-${String(s).replace('.', '_')}.png` })
    console.log('still', s)
  }
} else {
  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] })
  for (let f = 0; f < total; f++) {
    await step()
    const png = await page.screenshot({ type: 'png' })
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r))
    if (f % 60 === 0) console.log(`frame ${f}/${total}`)
  }
  ff.stdin.end()
  await new Promise((r) => ff.on('close', r))
  if (process.env.MUSIC) {
    // Mux the soundtrack in: copy the video stream, encode AAC audio.
    const tmp = out.replace(/\.mp4$/, '') + '.with-audio.mp4'
    const mux = spawn(ffmpeg, ['-y', '-i', out, '-i', process.env.MUSIC, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', tmp], { stdio: 'inherit' })
    await new Promise((r) => mux.on('close', r))
    renameSync(tmp, out)
  }
  console.log('wrote', out)
}
await browser.close()

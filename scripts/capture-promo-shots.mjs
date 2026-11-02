// Captures the real site pages used by the intro film's website tour, and
// measures the buttons the film's cursor clicks, so nothing is hard-coded.
//
//   npm run dev
//   node scripts/capture-promo-shots.mjs [base-url]
//
// Writes public/promo/*.jpg and src/promo/shots.json (imported by the film).
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:5173/#'
const OUT = new URL('../public/promo/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const W = 1440
const H = 900
const browser = await chromium.launch()
const shots = {}

async function page(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, ...opts })
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('pw.hint.map', 'true')
      localStorage.setItem('pw.guided', 'true')
      localStorage.setItem('pw.theme.choice', JSON.stringify('dark'))
    } catch {}
  })
  return { ctx, p: await ctx.newPage() }
}

/** A target's box in page coordinates (CSS px). */
async function box(p, locator) {
  const b = await locator.boundingBox()
  const y = await p.evaluate(() => window.scrollY)
  return { x: b.x, y: b.y + y, w: b.width, h: b.height }
}

async function save(p, name, targets = {}, full = false) {
  const scrollY = await p.evaluate(() => window.scrollY)
  await p.screenshot({ path: `${OUT}${name}.jpg`, type: 'jpeg', quality: 82, fullPage: full })
  const height = full ? await p.evaluate(() => document.documentElement.scrollHeight) : H
  // Viewport shots: store targets relative to the visible area.
  const rel = Object.fromEntries(Object.entries(targets).map(([k, t]) => [k, full ? t : { ...t, y: t.y - scrollY }]))
  shots[name] = { w: W, h: height, targets: rel }
  console.log('saved', name)
}

const pin = (p, sel, pad) =>
  p.evaluate(
    ([s, pad]) => {
      const el = document.querySelector(s)
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - pad)
    },
    [sel, pad],
  )

// 1. Landing, whole page, with the hero at its finished poster frame.
{
  const { ctx, p } = await page({ reducedMotion: 'reduce' })
  await p.goto(`${BASE}/`)
  await p.waitForTimeout(1500)
  await save(p, 'landing', { explore: await box(p, p.getByRole('link', { name: /Explore the Internet/ })), steps: await box(p, p.locator('ol').first()) }, true)
  await ctx.close()
}

// 2. Journey: a DNS packet on its way to the root server; then the bubble on the resolver.
{
  const { ctx, p } = await page()
  await p.goto(`${BASE}/journey`)
  await p.waitForTimeout(900)
  await p.locator('input[type=range]').first().fill('4')
  await p.waitForTimeout(1900)
  await pin(p, 'nav[aria-label="Journey stages"]', 90)
  await p.waitForTimeout(400)
  const resolver = p.locator('[aria-label*="learn what this machine"]').nth(2)
  await save(p, 'journey', { resolver: await box(p, resolver), map: await box(p, p.locator('svg[aria-label^="Network diagram"]')) })
  await resolver.click()
  await p.waitForTimeout(500)
  await save(p, 'journey-bubble')
  await ctx.close()
}

// 3. Lesson: breaking the handshake.
{
  const { ctx, p } = await page()
  await p.goto(`${BASE}/learn/tcp-handshake`)
  await p.waitForTimeout(900)
  await p.locator('text=Lose the SYN').first().click()
  await p.waitForTimeout(300)
  await p.locator('input[type=range]').first().fill('3')
  await p.waitForTimeout(1900)
  await pin(p, 'h1', 100)
  await p.waitForTimeout(400)
  await save(p, 'lesson')
  await ctx.close()
}

// 4. Playground before and after picking "SYN lost".
{
  const { ctx, p } = await page()
  await p.goto(`${BASE}/playground`)
  await p.waitForTimeout(1000)
  const chip = p.getByRole('radio', { name: 'SYN lost' })
  await save(p, 'playground', { syn: await box(p, chip) })
  await chip.click()
  await p.waitForTimeout(400)
  await p.locator('input[type=range]').nth(3).fill('3')
  await p.waitForTimeout(1900)
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(300)
  await save(p, 'playground-syn')
  await ctx.close()
}

// 5. "Now try it for real": before and after the real DNS lookup (one real request).
{
  const { ctx, p } = await page()
  await p.goto(`${BASE}/journey`)
  await p.waitForTimeout(900)
  await pin(p, '#real', 110)
  await p.waitForTimeout(400)
  const button = p.getByRole('button', { name: 'Look it up for real' })
  await save(p, 'real', { lookup: await box(p, button) })
  await button.click()
  await p.waitForTimeout(3500)
  await pin(p, '#real', 110)
  await p.waitForTimeout(300)
  await save(p, 'real-result')
  await ctx.close()
}

// 6. Learn: the lesson list, then a quiz question before and after answering.
{
  const { ctx, p } = await page()
  await p.goto(`${BASE}/learn`)
  await p.waitForTimeout(900)
  await save(p, 'learn', { lesson: await box(p, p.getByRole('link', { name: /TCP three-way handshake/ })) })
  await p.goto(`${BASE}/learn/tcp-handshake`)
  await p.waitForTimeout(900)
  await pin(p, '#quiz', 110)
  await p.waitForTimeout(400)
  const answer = p.getByRole('button', { name: '1001', exact: true })
  await save(p, 'quiz', { answer: await box(p, answer) })
  await answer.click()
  await p.waitForTimeout(400)
  await save(p, 'quiz-done')
  await ctx.close()
}

writeFileSync(new URL('../src/promo/shots.json', import.meta.url).pathname, JSON.stringify(shots, null, 2) + '\n')
await browser.close()
console.log('done')

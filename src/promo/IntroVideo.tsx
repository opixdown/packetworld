import { Github, Lock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Logo } from '../components/layout/Logo'
import { NetworkCanvas } from '../components/network/NetworkCanvas'
import type { Playback } from '../hooks/usePlayback'
import { PROTOCOL_COLOR, PROTOCOL_TINT, STAGE_INFO } from '../lib/protocols'
import { applyEvent, buildJourney, worldTimeline } from '../sim/journey'
import type { Stage } from '../sim/types'
import { bezier } from '../vendor/stageshow/ease'
import SHOTS from './shots.json'

// The intro film: a tour of the real website, 1920 × 1080, about 41 seconds.
// Everything on screen is a pure function of the time `t`, so a virtual clock
// can render it frame by frame. The website pages are real screenshots taken
// by scripts/capture-promo-shots.mjs, which also measures every button the
// cursor clicks. Plan and notes: docs/design/INTRO_VIDEO.md.

export const DURATION = 41.4

const settle = bezier('settle')
const through = bezier('through')
const house = bezier('house')
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
/** 0→1 progress of `t` between a and b, eased. */
const seg = (t: number, a: number, b: number, e: (x: number) => number = settle) => e(clamp01((t - a) / (b - a)))
const mix = (a: number, b: number, p: number) => a + (b - a) * p
/** Visible between `a` and `b`, fading over `f` seconds at each end. */
const window01 = (t: number, a: number, b: number, f = 0.3) => Math.min(seg(t, a, a + f, (x) => x), 1 - seg(t, b - f, b, (x) => x))

// --- Timeline ---------------------------------------------------------------

const T = {
  titleOut: 3.6,
  tourIn: 3.9,
  landingScrollDown: 5.0,
  landingScrollUp: 7.3,
  explorePress: 8.5,
  journeyPage: 8.75,
  pushIn: 9.2,
  mapIn: 10.2,
  packetsStart: 10.8,
  montageIn: 21.4,
  bubblePress: 23.05,
  learnPage: 24.4,
  lessonClick: 25.6,
  lessonPage: 25.85,
  quizPage: 28.2,
  quizPress: 29.3,
  playgroundPage: 30.8,
  synPress: 31.85,
  realPage: 33.4,
  lookupPress: 34.55,
  realResult: 35.0,
  endIn: 37.0,
}

type ShotName = keyof typeof SHOTS
type Box = { x: number; y: number; w: number; h: number }
const target = (shot: ShotName, key: string): Box => (SHOTS[shot].targets as Record<string, Box>)[key]
const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })

/** Which page the tour window shows, when, and at what address. */
const PAGES: { shot: ShotName; from: number; to: number; path: string }[] = [
  { shot: 'landing', from: T.tourIn, to: T.journeyPage, path: '' },
  { shot: 'journey', from: T.journeyPage, to: T.mapIn + 0.6, path: '#/journey' },
  { shot: 'journey', from: T.montageIn, to: T.bubblePress + 0.15, path: '#/journey' },
  { shot: 'journey-bubble', from: T.bubblePress + 0.15, to: T.learnPage, path: '#/journey' },
  { shot: 'learn', from: T.learnPage, to: T.lessonPage, path: '#/learn' },
  { shot: 'lesson', from: T.lessonPage, to: T.quizPage, path: '#/learn/tcp-handshake' },
  { shot: 'quiz', from: T.quizPage, to: T.quizPress + 0.15, path: '#/learn/tcp-handshake' },
  { shot: 'quiz-done', from: T.quizPress + 0.15, to: T.playgroundPage, path: '#/learn/tcp-handshake' },
  { shot: 'playground', from: T.playgroundPage, to: T.synPress + 0.15, path: '#/playground' },
  { shot: 'playground-syn', from: T.synPress + 0.15, to: T.realPage, path: '#/playground?exp=syn-lost' },
  { shot: 'real', from: T.realPage, to: T.realResult, path: '#/journey' },
  { shot: 'real-result', from: T.realResult, to: T.endIn + 0.6, path: '#/journey' },
]

const CAPTIONS: { text: string; from: number; to: number }[] = [
  { text: 'One website. Every packet, explained.', from: 4.2, to: 7.2 },
  { text: 'Press Explore, and watch a page load.', from: 7.2, to: 10.1 },
  { text: 'Tap anything to learn what it is.', from: 21.7, to: T.learnPage },
  { text: 'Ten short lessons, from IP addresses to NAT.', from: T.learnPage, to: T.lessonPage },
  { text: 'Each one lets you break things on purpose.', from: T.lessonPage, to: T.quizPage },
  { text: 'Then check what you learned.', from: T.quizPage, to: T.playgroundPage },
  { text: 'Change the network. See what happens.', from: T.playgroundPage, to: T.realPage },
  { text: 'Then try it for real.', from: T.realPage, to: T.endIn },
]

/** Cursor path in page-content coordinates: where it is at each moment, and when it clicks. */
const CURSOR = {
  shows: [
    [7.45, 9.1],
    [21.9, T.endIn],
  ] as [number, number][],
  moves: [
    { at: 7.5, dur: 0.95, to: centre(target('landing', 'explore')) },
    { at: 21.95, dur: 0.01, to: { x: 1180, y: 820 } },
    { at: 22.15, dur: 0.85, to: centre(target('journey', 'resolver')) },
    { at: 23.7, dur: 0.6, to: { x: 1260, y: 760 } },
    { at: 24.7, dur: 0.85, to: centre(target('learn', 'lesson')) },
    { at: 26.1, dur: 0.7, to: { x: 1260, y: 800 } },
    { at: 28.45, dur: 0.8, to: centre(target('quiz', 'answer')) },
    { at: 29.9, dur: 0.6, to: { x: 1200, y: 780 } },
    { at: 31.0, dur: 0.8, to: centre(target('playground', 'syn')) },
    { at: 32.5, dur: 0.6, to: { x: 1100, y: 600 } },
    { at: 33.65, dur: 0.85, to: centre(target('real', 'lookup')) },
    { at: 35.2, dur: 0.7, to: { x: 1240, y: 760 } },
  ],
  presses: [T.explorePress, T.bubblePress, T.lessonClick, T.quizPress, T.synPress, T.lookupPress],
}

function cursorAt(t: number) {
  let pos = { x: 1180, y: 820 }
  for (const m of CURSOR.moves) {
    if (t <= m.at) break
    const p = house(clamp01((t - m.at) / m.dur))
    pos = { x: mix(pos.x, m.to.x, p), y: mix(pos.y, m.to.y, p) }
  }
  return pos
}

// --- Time source -------------------------------------------------------------

function useFilmTime(ready: boolean): number {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!ready) return
    let frame = 0
    let start = 0
    const recording = location.hash.includes('record')
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000
      // Preview loops; a recording plays once.
      setT(recording ? Math.min(elapsed, DURATION) : elapsed % DURATION)
      frame = requestAnimationFrame(tick)
    }
    const begin = () => {
      start = performance.now()
      frame = requestAnimationFrame(tick)
    }
    if (recording) window.addEventListener('pw-start', begin, { once: true })
    else document.fonts.ready.then(begin)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pw-start', begin)
    }
  }, [ready])
  return t
}

/** Loads every screenshot before the film starts, so no frame shows a half-loaded image. */
function usePreload(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.all(
      (Object.keys(SHOTS) as ShotName[]).map(
        (name) =>
          new Promise<void>((resolve) => {
            const img = new Image()
            img.onload = img.onerror = () => resolve()
            img.src = `promo/${name}.jpg`
          }),
      ),
    ).then(async () => {
      await document.fonts.ready
      if (!alive) return
      setReady(true)
      ;(window as unknown as { __filmReady: boolean }).__filmReady = true
    })
    return () => {
      alive = false
    }
  }, [])
  return ready
}

// --- The film ------------------------------------------------------------------

export function IntroVideo() {
  const ready = usePreload()
  // The film is always dark, whatever theme the viewer picked for the site.
  useEffect(() => {
    const root = document.documentElement
    const before = root.dataset.theme
    root.dataset.theme = 'dark'
    return () => {
      root.dataset.theme = before
    }
  }, [])
  const t = useFilmTime(ready)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-paper-2">
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden bg-paper"
        style={{
          width: 1920,
          height: 1080,
          transform: `translate(-50%, -50%) scale(${scale})`,
          backgroundImage:
            'linear-gradient(to right, rgb(239 233 220 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(239 233 220 / 0.06) 1px, transparent 1px), linear-gradient(to right, rgb(239 233 220 / 0.028) 1px, transparent 1px), linear-gradient(to bottom, rgb(239 233 220 / 0.028) 1px, transparent 1px)',
          backgroundSize: '160px 160px, 160px 160px, 32px 32px, 32px 32px',
        }}
      >
        {t < T.tourIn + 0.8 && <TitleScene t={t} />}
        <Captions t={t} />
        {((t >= T.tourIn - 0.1 && t < T.mapIn + 0.7) || (t >= T.montageIn - 0.1 && t < T.endIn + 0.7)) && <TourWindow t={t} />}
        {t >= T.mapIn - 0.1 && t < T.montageIn + 0.6 && <MapScene t={t} />}
        {t >= T.endIn - 0.1 && <EndScene t={t} />}
      </div>
    </div>
  )
}

// --- Scene 1: the hook ----------------------------------------------------------

function Words({ text, t, from, step }: { text: string; t: number; from: number; step: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => {
        const p = seg(t, from + i * step, from + i * step + 0.55)
        return (
          <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${mix(28, 0, p)}px)`, marginRight: '0.25em' }}>
            {w === 'seen' ? <Marked t={t} /> : w}
          </span>
        )
      })}
    </>
  )
}

function Marked({ t }: { t: number }) {
  const p = seg(t, 2.55, 3.05, house)
  return (
    <span className="relative inline-block italic">
      <span className="absolute -inset-x-1 bottom-[0.06em] top-[0.6em] origin-left bg-[rgb(245_213_71_/_0.45)]" style={{ transform: `scaleX(${p})` }} />
      <span className="relative">seen</span>
    </span>
  )
}

function TitleScene({ t }: { t: number }) {
  const out = seg(t, T.titleOut, T.tourIn + 0.5, through)
  const tag = seg(t, 0.15, 0.75)
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-[180px]" style={{ opacity: 1 - out, transform: `translateY(${-80 * out}px)` }}>
      <div
        className="mb-10 self-start rounded border-2 border-edge bg-card px-4 py-2 font-mono text-[26px] font-semibold shadow-note"
        style={{ opacity: tag, transform: `translateY(${mix(-24, 0, tag)}px) rotate(-1.5deg)` }}
      >
        The internet is not magic.
      </div>
      <h1 className="font-display text-[100px] font-semibold leading-[1.06] tracking-tight text-fg">
        <span className="block whitespace-nowrap">
          <Words text="You use the internet every day." t={t} from={0.45} step={0.09} />
        </span>
        <span className="block whitespace-nowrap">
          <Words text="But have you ever seen" t={t} from={1.5} step={0.09} />
        </span>
        <span className="block whitespace-nowrap">
          <Words text="how it works?" t={t} from={1.95} step={0.09} />
        </span>
      </h1>
    </div>
  )
}

// --- Captions above the window --------------------------------------------------

function Captions({ t }: { t: number }) {
  return (
    <>
      {CAPTIONS.map((c) => {
        const o = window01(t, c.from, c.to, 0.35)
        if (o <= 0) return null
        return (
          <div
            key={c.text}
            className="absolute inset-x-0 top-[34px] text-center font-display text-[54px] font-semibold text-fg"
            style={{ opacity: o, transform: `translateY(${mix(14, 0, seg(t, c.from, c.from + 0.45))}px)` }}
          >
            {c.text}
          </div>
        )
      })}
    </>
  )
}

// --- The tour window: real pages, a cursor, and the camera ------------------------

const WIN = { left: 240, top: 118, w: 1440, h: 900, bar: 52 }

function TourWindow({ t }: { t: number }) {
  const first = t < T.montageIn - 0.2
  // Arrive from below; leave by dissolving into the next scene.
  const inP = first ? seg(t, T.tourIn, T.tourIn + 0.8) : seg(t, T.montageIn, T.montageIn + 0.7)
  const outP = first ? seg(t, T.mapIn - 0.1, T.mapIn + 0.5, through) : seg(t, T.endIn - 0.1, T.endIn + 0.6, through)

  // Landing page scroll: down to the four steps, then back up to the button.
  const stepsY = target('landing', 'steps').y - 200
  const scroll = mix(0, stepsY, seg(t, T.landingScrollDown, T.landingScrollDown + 1.6, house)) * (1 - seg(t, T.landingScrollUp, T.landingScrollUp + 0.8, house))

  // Camera: push into the network map before cutting to the live animation.
  const map = target('journey', 'map')
  const zoom = Math.min(WIN.w / map.w, WIN.h / map.h) * 0.97
  const push = first ? seg(t, T.pushIn, T.mapIn + 0.2, house) : 0
  const camScale = mix(1, zoom, push)
  const camX = mix(0, WIN.w / 2 - (map.x + map.w / 2) * zoom, push)
  const camY = mix(0, WIN.h / 2 - (map.y + map.h / 2) * zoom, push)

  // A slow drift on the lesson page.
  const drift = window01(t, T.lessonPage, T.quizPage, 0.01) > 0 ? mix(1, 1.035, seg(t, T.lessonPage, T.quizPage, (x) => x)) : 1

  const current = [...PAGES].reverse().find((p) => t >= p.from - 0.01) ?? PAGES[0]

  return (
    <div
      className="absolute overflow-hidden rounded-lg border-[3px] border-edge bg-card shadow-[8px_8px_0_0_#6E675C]"
      style={{
        left: WIN.left,
        top: WIN.top,
        width: WIN.w + 6,
        height: WIN.h + WIN.bar + 6,
        opacity: inP * (1 - outP),
        transform: `translateY(${mix(140, 0, inP)}px)`,
      }}
    >
      <div className="flex items-center gap-3 border-b-[3px] border-edge bg-wash px-5" style={{ height: WIN.bar }}>
        <span className="h-4 w-4 rounded-full bg-[#ff5f57]" />
        <span className="h-4 w-4 rounded-full bg-[#febc2e]" />
        <span className="h-4 w-4 rounded-full bg-[#28c840]" />
        <span className="ml-4 flex flex-1 items-center gap-2 rounded-md bg-paper px-4 py-1.5 font-mono text-[22px] text-fg">
          <Lock size={20} className="text-proto-tls" />
          packetworld.vercel.app<span className="text-fg-faint">/{current.path}</span>
        </span>
      </div>
      <div className="relative overflow-hidden" style={{ width: WIN.w, height: WIN.h }}>
        <div style={{ transformOrigin: '0 0', transform: `translate(${camX}px, ${camY}px) scale(${camScale * drift})` }}>
          {PAGES.map((p, i) => {
            const o = window01(t, p.from, p.to, 0.28)
            if (o <= 0) return null
            const h = SHOTS[p.shot].h
            return (
              <img
                key={i}
                src={`promo/${p.shot}.jpg`}
                alt=""
                className="absolute left-0 top-0"
                style={{ width: WIN.w, height: h, opacity: o, transform: p.shot === 'landing' ? `translateY(${-scroll}px)` : undefined }}
              />
            )
          })}
        </div>
        <Cursor t={t} />
      </div>
    </div>
  )
}

function Cursor({ t }: { t: number }) {
  const shown = Math.max(...CURSOR.shows.map(([a, b]) => window01(t, a, b, 0.25)))
  if (shown <= 0) return null
  const { x, y } = cursorAt(t)
  const press = CURSOR.presses.find((p) => t >= p - 0.05 && t < p + 0.6)
  const dip = press !== undefined && t < press + 0.12 ? 0.86 : 1
  const ring = press !== undefined ? clamp01((t - press) / 0.5) : 1
  return (
    <>
      {press !== undefined && ring < 1 && (
        <span
          className="pointer-events-none absolute rounded-full border-[3px] border-proto-dns"
          style={{ left: x - 30 * ring - 6, top: y - 30 * ring - 6, width: 60 * ring + 12, height: 60 * ring + 12, opacity: 1 - ring }}
        />
      )}
      <svg width="40" height="48" viewBox="0 0 20 24" className="pointer-events-none absolute" style={{ left: x - 3, top: y - 2, opacity: shown, transform: `scale(${dip})`, transformOrigin: '3px 2px' }}>
        <path d="M2 1.5 L2 19 L6.6 14.8 L9.6 21.6 L12.6 20.3 L9.7 13.6 L16 13.4 Z" fill="#EFE9DC" stroke="#100F0D" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </>
  )
}

// --- Scene 3: the live journey -------------------------------------------------------

const STAGE_LINE: Record<Stage, string> = {
  dns: 'Turn example.com into an IP address.',
  tcp: 'Three small packets agree to talk.',
  tls: 'Agree on secret keys. Check the certificate.',
  http: 'Ask for the page. Get it back.',
}

function useSchedule() {
  return useMemo(() => {
    const journey = buildJourney({ dnsCache: 'cold' })
    const worlds = worldTimeline(journey)
    const wanted = journey.events.map((e, i) => ({ e, i })).filter(({ e }) => e.kind === 'packet' && !/css/i.test(e.packet!.label))
    let at = T.packetsStart
    const items = wanted.map(({ e, i }) => {
      const dur = e.stage === 'dns' ? 0.42 : 0.56
      const item = { index: i, stage: e.stage, start: at, dur }
      at += dur
      return item
    })
    return { journey, worlds, items, end: at }
  }, [])
}

function MapScene({ t }: { t: number }) {
  const { journey, worlds, items, end } = useSchedule()
  const inP = seg(t, T.mapIn, T.mapIn + 0.7)
  const outP = seg(t, T.montageIn - 0.3, T.montageIn + 0.4, through)

  let k = items.findIndex((it, i) => t >= it.start && (i === items.length - 1 || t < items[i + 1].start))
  if (t < T.packetsStart) k = 0
  const item = items[Math.max(0, k)]
  const event = journey.events[item.index]
  const progress = t < T.packetsStart ? 0 : clamp01((t - item.start) / (item.dur * 0.82))
  const world = applyEvent(worlds[item.index], event, progress >= 1)
  const playback = { event, progress, world, index: item.index } as unknown as Playback
  const stage = item.stage
  const info = STAGE_INFO[stage]
  const stageNo = (['dns', 'tcp', 'tls', 'http'] as Stage[]).indexOf(stage) + 1
  const pageIn = seg(t, end + 0.15, end + 0.9)
  const caption = seg(t, T.packetsStart - 0.3, T.packetsStart + 0.2)

  return (
    <div className="absolute inset-0" style={{ opacity: inP * (1 - outP), transform: `scale(${mix(1.03, 1, inP) * mix(1, 0.95, outP)})` }}>
      <div className="absolute left-[120px] top-[70px] flex items-center gap-6" style={{ opacity: caption }}>
        <div
          key={stage}
          className="grid h-[96px] w-[96px] animate-fade-up place-items-center rounded-full border-[3px] border-edge font-display text-[52px] font-semibold"
          style={{ background: PROTOCOL_TINT[info.protocol] }}
        >
          {stageNo}
        </div>
        <div key={`${stage}-text`} className="animate-fade-up">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-[44px] font-semibold" style={{ color: PROTOCOL_COLOR[info.protocol] }}>
              {info.name}
            </span>
            <span className="font-display text-[56px] font-semibold text-fg">{info.title}</span>
          </div>
          <div className="mt-1 text-[30px] text-fg-muted">{STAGE_LINE[stage]}</div>
        </div>
      </div>
      <div className="absolute right-[120px] top-[96px] font-mono text-[26px] text-fg-faint" style={{ opacity: caption }}>
        packet {Math.max(1, k + 1)} of {items.length}
      </div>

      <div className="absolute left-1/2 top-[236px] w-[1500px] -translate-x-1/2 rounded-lg border-[3px] border-edge bg-card/70 shadow-[6px_6px_0_0_#6E675C]">
        <NetworkCanvas journey={journey} playback={playback} selection={null} onSelect={() => {}} />
      </div>

      <div
        className="absolute bottom-[70px] right-[150px] w-[660px] overflow-hidden rounded-lg border-[3px] border-edge bg-card shadow-[8px_8px_0_0_#6E675C]"
        style={{ opacity: pageIn, transform: `translateY(${mix(120, 0, pageIn)}px)` }}
      >
        <div className="flex items-center gap-3 border-b-[3px] border-edge bg-wash px-5 py-3">
          <span className="h-4 w-4 rounded-full bg-[#ff5f57]" />
          <span className="h-4 w-4 rounded-full bg-[#febc2e]" />
          <span className="h-4 w-4 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex flex-1 items-center gap-2 rounded bg-paper px-4 py-1.5 font-mono text-[24px]">
            <Lock size={22} className="text-proto-tls" /> example.com
          </span>
        </div>
        <div className="bg-paper px-10 py-9">
          <div className="font-display text-[46px] font-semibold text-fg">Example Domain</div>
          <p className="mt-3 text-[26px] leading-snug text-fg-muted">This domain is for use in documentation examples without needing permission.</p>
          <div className="mt-6 inline-flex items-center gap-3 rounded border-2 border-proto-http bg-tint-http px-3 py-1 font-mono text-[24px] font-semibold text-proto-http">
            200 OK · page loaded
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Scene 5: the end card --------------------------------------------------------------

function EndScene({ t }: { t: number }) {
  const logo = seg(t, T.endIn, T.endIn + 0.8)
  const text = seg(t, T.endIn + 0.25, T.endIn + 1.05)
  const url = seg(t, T.endIn + 0.6, T.endIn + 1.4)
  const foot = seg(t, T.endIn + 1.0, T.endIn + 1.8)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <div style={{ opacity: logo, transform: `scale(${mix(0.85, 1, logo)})` }}>
        <Logo size={150} />
      </div>
      <div className="mt-10 font-display text-[140px] font-semibold leading-none tracking-tight text-fg" style={{ opacity: text, transform: `translateY(${mix(30, 0, text)}px)` }}>
        PacketWorld
      </div>
      <div className="mt-6 text-[46px] text-fg-muted" style={{ opacity: text }}>
        The internet is not magic. <span className="pw-mark text-fg">See how it works.</span>
      </div>
      <div
        className="mt-14 rounded-lg border-[3px] border-edge bg-fg px-10 py-5 font-mono text-[50px] font-semibold text-card"
        style={{ opacity: url, transform: `translateY(${mix(40, 0, url)}px)`, boxShadow: '7px 7px 0 0 #F2B84B' }}
      >
        packetworld.vercel.app
      </div>
      <div className="mt-12 flex items-center gap-3 text-[32px] text-fg-muted" style={{ opacity: foot }}>
        <Github size={34} /> Free and open source · github.com/opixdown/packetworld
      </div>
    </div>
  )
}

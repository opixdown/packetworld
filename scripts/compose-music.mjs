// Composes the intro film's soundtrack in code: an original, royalty-free
// track timed to the film's scenes, with a click on every cursor press.
//
//   node scripts/compose-music.mjs [out.wav]
//
// Pure Node, no dependencies. Deterministic: the same file every time.
// The scene times mirror `T` in src/promo/IntroVideo.tsx; keep them in sync.
import { writeFileSync } from 'node:fs'

const OUT = process.argv[2] ?? 'packetworld-intro.wav'
const SR = 44100
const DURATION = 41.4
const N = Math.ceil(DURATION * SR)
const L = new Float32Array(N)
const R = new Float32Array(N)
const padL = new Float32Array(N) // pad and arp also feed the echo
const padR = new Float32Array(N)

// Film timing (seconds)
const T = { tourIn: 3.9, mapIn: 10.2, montageIn: 21.4, endIn: 37.0 }
const PRESSES = [8.5, 23.05, 25.6, 29.3, 31.85, 34.55]
const WHOOSHES = [3.7, 10.0, 21.2, 36.8]

const BEAT = 60 / 96
const BAR = BEAT * 4
const freq = (midi) => 440 * 2 ** ((midi - 69) / 12)

// Fmaj7 → G6 → Em7 → Am7, one chord per bar.
const CHORDS = [
  { notes: [53, 57, 60, 64], root: 41 },
  { notes: [55, 59, 62, 64], root: 43 },
  { notes: [52, 55, 59, 62], root: 40 },
  { notes: [57, 60, 64, 67], root: 45 },
]
const FINAL = { notes: [48, 52, 55, 59, 62], root: 36 } // Cmaj9 for the end card

let seed = 12345
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 2 ** 31 - 1
}

const at = (t) => Math.max(0, Math.min(N - 1, Math.round(t * SR)))

function add(buf, i, v) {
  if (i >= 0 && i < N) buf[i] += v
}

// --- Instruments --------------------------------------------------------------

/** A soft, slightly detuned pad note with a slow attack and long release. */
function pad(midi, t0, t1, amp) {
  const f = freq(midi)
  const attack = 0.45
  const release = 0.9
  const end = t1 + release
  for (let i = at(t0); i < at(end); i++) {
    const t = i / SR - t0
    const env = Math.min(1, t / attack) * (i / SR > t1 ? Math.max(0, 1 - (i / SR - t1) / release) : 1)
    let l = 0
    let r = 0
    for (let h = 1; h <= 5; h++) {
      const a = 1 / h ** 1.8
      l += a * Math.sin(2 * Math.PI * f * h * 1.0023 * t)
      r += a * Math.sin(2 * Math.PI * f * h * 0.9977 * t + 0.7)
    }
    add(padL, i, l * env * amp)
    add(padR, i, r * env * amp)
  }
}

function bass(midi, t0, len, amp) {
  const f = freq(midi)
  for (let i = at(t0); i < at(t0 + len + 0.15); i++) {
    const t = i / SR - t0
    const env = Math.min(1, t / 0.01) * (0.55 + 0.45 * Math.exp(-t / 0.18)) * (t > len ? Math.max(0, 1 - (t - len) / 0.15) : 1)
    const v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * env * amp
    add(L, i, v)
    add(R, i, v)
  }
}

function pluck(midi, t0, amp, pan) {
  const f = freq(midi)
  for (let i = at(t0); i < at(t0 + 0.9); i++) {
    const t = i / SR - t0
    const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.2)
    const v = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t) + 0.08 * Math.sin(6 * Math.PI * f * t)) * env * amp
    add(padL, i, v * (1 - pan))
    add(padR, i, v * (1 + pan))
  }
}

const kicks = []
function kick(t0, amp) {
  kicks.push(t0)
  let phase = 0
  for (let i = at(t0); i < at(t0 + 0.45); i++) {
    const t = i / SR - t0
    phase += (2 * Math.PI * (45 + 85 * Math.exp(-t / 0.035))) / SR
    const v = Math.sin(phase) * Math.exp(-t / 0.2) * amp
    add(L, i, v)
    add(R, i, v)
  }
}

function hat(t0, amp) {
  let prev = 0
  for (let i = at(t0); i < at(t0 + 0.12); i++) {
    const t = i / SR - t0
    const n = noise()
    const v = (n - prev) * Math.exp(-t / 0.028) * amp
    prev = n
    add(L, i, v * 0.8)
    add(R, i, v)
  }
}

function clap(t0, amp) {
  for (const off of [0, 0.011, 0.022]) {
    let lp = 0
    for (let i = at(t0 + off); i < at(t0 + off + 0.25); i++) {
      const t = i / SR - t0 - off
      lp += 0.35 * (noise() - lp)
      const v = (noise() - lp) * Math.exp(-t / 0.07) * amp
      add(L, i, v)
      add(R, i, v * 0.9)
    }
  }
}

function click(t0, amp) {
  for (let i = at(t0); i < at(t0 + 0.06); i++) {
    const t = i / SR - t0
    const env = Math.exp(-t / 0.011)
    const v = (Math.sin(2 * Math.PI * 1900 * t) * 0.7 + noise() * 0.3) * env * amp
    add(L, i, v)
    add(R, i, v)
  }
}

function whoosh(t0, amp) {
  let lp = 0
  for (let i = at(t0 - 0.6); i < at(t0 + 0.5); i++) {
    const t = i / SR - (t0 - 0.6)
    const rise = Math.min(1, t / 0.6)
    const env = t < 0.6 ? rise ** 2 : Math.max(0, 1 - (t - 0.6) / 0.5)
    lp += (0.02 + 0.25 * rise) * (noise() - lp)
    const v = lp * env * amp
    add(L, i, v * (1 - rise * 0.4))
    add(R, i, v * (0.6 + rise * 0.4))
  }
}

// --- The arrangement ------------------------------------------------------------

const bars = Math.ceil(T.endIn / BAR)
for (let b = 0; b < bars; b++) {
  const t0 = b * BAR
  if (t0 >= T.endIn) break
  const chord = CHORDS[b % CHORDS.length]
  const t1 = Math.min(t0 + BAR, T.endIn)
  const padAmp = t0 < T.tourIn ? 0.05 : 0.042
  for (const n of chord.notes) pad(n, t0, t1, padAmp)

  for (let beat = 0; beat < 4; beat++) {
    const bt = t0 + beat * BEAT
    if (bt >= T.endIn) break
    const inTour = bt >= T.tourIn - 0.2
    const inJourney = bt >= T.mapIn - 0.05
    // Bass and kick on beats 1 and 3 from the website tour on.
    if (inTour && (beat === 0 || beat === 2)) {
      bass(chord.root, bt, BEAT * 1.6, 0.12)
      kick(bt, 0.34)
    }
    if (inJourney && (beat === 1 || beat === 3)) clap(bt, 0.06)
    // Arpeggio: quarters during the tour, eighths from the journey on.
    const arp = [0, 1, 2, 3, 2, 1, 2, 3]
    if (inJourney) {
      for (const half of [0, 1]) {
        const k = (beat * 2 + half) % arp.length
        pluck(chord.notes[arp[k]] + 12, bt + half * (BEAT / 2), 0.055, half ? 0.35 : -0.35)
        hat(bt + BEAT / 2 + 0, half ? 0 : 0.03)
      }
    } else if (inTour) {
      pluck(chord.notes[arp[beat]] + 12, bt, 0.05, beat % 2 ? 0.3 : -0.3)
    }
  }
}

// End card: a final open chord rings out.
for (const n of FINAL.notes) pad(n, T.endIn, DURATION - 1.2, 0.05)
bass(FINAL.root, T.endIn, 2.6, 0.15)
for (const [i, n] of [0, 2, 4, 3].entries()) pluck(FINAL.notes[n] + 12, T.endIn + 0.3 + i * 0.28, 0.05, i % 2 ? 0.3 : -0.3)

for (const t of WHOOSHES) whoosh(t, 0.22)
for (const t of PRESSES) click(t, 0.28)

// --- Mix --------------------------------------------------------------------------

// Duck the pad under each kick, then add a simple stereo echo for space.
for (const k of kicks) {
  for (let i = at(k); i < at(k + 0.4); i++) {
    const g = 1 - 0.45 * Math.exp(-(i / SR - k) / 0.12)
    padL[i] *= g
    padR[i] *= g
  }
}
const dl = Math.round(0.31 * SR)
const dr = Math.round(0.37 * SR)
const echoL = new Float32Array(N)
const echoR = new Float32Array(N)
for (let i = 0; i < N; i++) {
  echoL[i] = (i >= dl ? padL[i - dl] + echoR[i - dl] * 0.3 : 0) * 0.55
  echoR[i] = (i >= dr ? padR[i - dr] + echoL[i - dr] * 0.3 : 0) * 0.55
}
let peak = 0
for (let i = 0; i < N; i++) {
  const t = i / SR
  const fade = Math.min(1, t / 0.5) * Math.min(1, (DURATION - t) / 2.2)
  L[i] = Math.tanh((L[i] + padL[i] + echoL[i] * 0.3) * 1.3) * fade
  R[i] = Math.tanh((R[i] + padR[i] + echoR[i] * 0.3) * 1.3) * fade
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
}
const gain = 0.89 / peak

// --- 16-bit stereo WAV -------------------------------------------------------------

const data = Buffer.alloc(N * 4)
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), i * 4)
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), i * 4 + 2)
}
const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + data.length, 4)
header.write('WAVE', 8)
header.write('fmt ', 12)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(2, 22)
header.writeUInt32LE(SR, 24)
header.writeUInt32LE(SR * 4, 28)
header.writeUInt16LE(4, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(data.length, 40)
writeFileSync(OUT, Buffer.concat([header, data]))
console.log(`wrote ${OUT} (${DURATION}s)`)

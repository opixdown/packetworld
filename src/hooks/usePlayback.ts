import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { load, save } from '../lib/storage'
import { applyEvent } from '../sim/journey'
import type { SimEvent, WorldState } from '../sim/types'

// Drives any list of SimEvents: play, pause, step, seek, speed.
//
// Animation time is deliberately decoupled from simulated time. A 30 ms network
// trip and a 1 s retransmission timer both need to be watchable, so each step
// gets a readable duration, mildly stretched for longer simulated durations.
// See docs/decisions/0004-own-playback-clock.md.

export const SPEEDS = [0.5, 1, 2, 4] as const

/** Real milliseconds for the moving part of a step, at 1× speed. */
export function travelTime(e: SimEvent): number {
  if (e.kind === 'packet') return Math.min(1700, 950 + 18 * Math.sqrt(Math.min(e.duration, 2000)))
  return e.duration >= 400 ? 1100 : 700
}

/** Pause after a step lands, so there is time to read before the next one. */
const DWELL = 700

export interface Playback {
  index: number
  /** 0–1: how far the current step's animation has run. */
  progress: number
  playing: boolean
  speed: number
  /** True once the last step has finished. */
  done: boolean
  world: WorldState
  event: SimEvent | undefined
  /** Simulated clock at this moment, in ms. */
  simTime: number
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  restart: () => void
  seek: (index: number) => void
  setSpeed: (speed: number) => void
  /** Guided mode: stop after every step so the learner can read, then press Next. */
  guided: boolean
  setGuided: (guided: boolean) => void
  /** True when the current step's animation has finished. */
  stepDone: boolean
}

export function usePlayback(events: SimEvent[], initial: WorldState, opts: { autoplay?: boolean } = {}): Playback {
  const [index, setIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(!!opts.autoplay)
  const [speed, setSpeed] = useState(1)
  const [guided, setGuidedState] = useState(() => load('pw.guided', true))
  const setGuided = useCallback((g: boolean) => {
    setGuidedState(g)
    save('pw.guided', g)
  }, [])
  /** When set, playback stops after this step (single-step mode). */
  const stopAfter = useRef<number | null>(null)

  // Reset when the journey changes.
  useEffect(() => {
    setIndex(0)
    setElapsed(0)
    stopAfter.current = null
    setPlaying(!!opts.autoplay)
  }, [events])

  const worlds = useMemo(() => {
    const list: WorldState[] = [initial]
    events.forEach((e, i) => list.push(applyEvent(list[i], e, true)))
    return list
  }, [events, initial])

  const event = events[index]
  const travel = event ? travelTime(event) : 1
  const progress = Math.min(1, elapsed / travel)
  const last = events.length - 1
  const done = index >= last && progress >= 1

  // The animation clock.
  const state = useRef({ index, elapsed, speed, travel, last, guided })
  state.current = { index, elapsed, speed, travel, last, guided }
  useEffect(() => {
    if (!playing || events.length === 0) return
    let frame = 0
    let before = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - before) * state.current.speed
      before = now
      const s = state.current
      const next = s.elapsed + dt
      // In guided mode there is no dwell: the step card is the reading time.
      const end = s.guided ? s.travel : s.travel + DWELL
      if (next < end) {
        setElapsed(next)
      } else if (s.guided || stopAfter.current === s.index || s.index >= s.last) {
        setElapsed(s.travel)
        setPlaying(false)
        stopAfter.current = null
        return
      } else {
        setIndex(s.index + 1)
        setElapsed(0)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, events.length])

  const stepTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(events.length - 1, i))
      setIndex(clamped)
      setElapsed(0)
      stopAfter.current = clamped
      setPlaying(true)
    },
    [events.length],
  )

  const play = useCallback(() => {
    stopAfter.current = null
    if (done) {
      setIndex(0)
      setElapsed(0)
    } else if (guided && progress >= 1) {
      // Guided: "play" means "show me the next step".
      setIndex(index + 1)
      setElapsed(0)
    }
    setPlaying(true)
  }, [done, guided, progress, index])

  const pause = useCallback(() => setPlaying(false), [])

  const world = event ? applyEvent(worlds[index], event, progress >= 1) : worlds[worlds.length - 1]
  const simTime = event ? event.t + event.duration * progress : 0

  return {
    index,
    progress,
    playing,
    speed,
    done,
    world,
    event,
    simTime,
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    next: () => (index < last ? stepTo(index + 1) : setElapsed(travel)),
    prev: () => stepTo(index - 1),
    restart: () => {
      stopAfter.current = null
      setIndex(0)
      setElapsed(0)
      setPlaying(true)
    },
    seek: stepTo,
    setSpeed,
    guided,
    setGuided,
    stepDone: progress >= 1,
  }
}

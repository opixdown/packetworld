import { JourneyBuilder } from './builder'
import { DEFAULT_CONFIG, type JourneyConfig } from './config'
import { buildDns } from './stages/dns'
import { buildHttp } from './stages/http'
import { buildTcp } from './stages/tcp'
import { buildTls } from './stages/tls'
import { parseTarget } from './target'
import type { Journey, Outcome, Stage, StageSpan, WorldState } from './types'

export const STAGES: Stage[] = ['dns', 'tcp', 'tls', 'http']

export const INITIAL_WORLD: WorldState = {
  tcpClient: 'CLOSED',
  tcpServer: 'LISTEN',
  tls: 'none',
  resolvedIp: null,
  browser: 'blank',
  error: null,
  httpStatus: null,
  resources: [],
}

/**
 * Builds the complete, deterministic list of events for opening a URL.
 * Throws TargetError for addresses that cannot be simulated.
 */
export function buildJourney(partial: Partial<JourneyConfig> = {}): Journey {
  const config: JourneyConfig = { ...DEFAULT_CONFIG, ...partial }
  const target = parseTarget(config.url)
  const b = new JourneyBuilder(config, target)
  const notes: string[] = []
  let outcome: Outcome = 'success'

  run: {
    if (target.isIpLiteral) {
      b.local(
        'dns',
        'client',
        'No DNS needed: you typed an IP address',
        {
          beginner: 'You typed a numeric address directly, so there is no name to look up. The browser can connect straight away.',
          technical: 'IP literal in the URL: no resolution. Note that HTTPS certificates are rarely issued for bare IPs.',
        },
        { onEnd: { resolvedIp: target.host, browser: 'connecting' } },
      )
    } else if (!buildDns(b, notes)) {
      outcome = 'dns-failed'
      break run
    }

    const tcp = buildTcp(b)
    if (!tcp.ok) {
      outcome = 'timeout'
      break run
    }

    const tls = buildTls(b, tcp)
    if (!tls.ok) {
      outcome = 'cert-failed'
      break run
    }

    if (!buildHttp(b, tls)) outcome = 'http-error'
  }

  if (config.lossPercent > 0) {
    notes.push('Random loss is capped at three losses per packet so every journey finishes. Real networks have no such cap.')
  }

  return { target, events: b.events, stages: stageSpans(b.events), outcome, initial: INITIAL_WORLD, notes }
}

function stageSpans(events: Journey['events']): StageSpan[] {
  const spans: StageSpan[] = []
  events.forEach((e, i) => {
    const end = e.t + e.duration
    const span = spans.find((s) => s.stage === e.stage)
    if (!span) spans.push({ stage: e.stage, firstIndex: i, lastIndex: i, start: e.t, end })
    else {
      span.lastIndex = i
      span.end = Math.max(span.end, end)
    }
  })
  return spans
}

/**
 * Keeps only some stages of a journey, for focused lessons. The initial world
 * is the state just before the first kept event, and times start at zero.
 */
export function sliceJourney(journey: Journey, stages: Stage[]): Journey {
  const first = journey.events.findIndex((e) => stages.includes(e.stage))
  if (first < 0) return { ...journey, events: [], stages: [] }
  const initial = worldBefore(journey, first)
  const offset = journey.events[first].t
  const events = journey.events.filter((e) => stages.includes(e.stage)).map((e) => ({ ...e, t: e.t - offset }))
  return { ...journey, events, stages: stageSpans(events), initial }
}

/** World state before event `index` starts. */
export function worldBefore(journey: Journey, index: number): WorldState {
  let world = journey.initial
  for (let i = 0; i < index && i < journey.events.length; i++) world = applyEvent(world, journey.events[i], true)
  return world
}

export function applyEvent(world: WorldState, event: Journey['events'][number], completed: boolean): WorldState {
  let next = event.onStart ? { ...world, ...event.onStart } : world
  if (completed && event.onEnd) next = { ...next, ...event.onEnd }
  return next
}

/**
 * Precomputes the world before each event, so the UI can show any step instantly.
 * worlds[i] is the state before event i; worlds[events.length] is the final state.
 */
export function worldTimeline(journey: Journey): WorldState[] {
  const worlds: WorldState[] = [journey.initial]
  journey.events.forEach((e, i) => worlds.push(applyEvent(worlds[i], e, true)))
  return worlds
}

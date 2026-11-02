import type { JourneyConfig } from './config'
import { createRng, hash } from './random'
import { oneWayLatency } from './topology'
import type { Endpoint, Explanation, Fate, Layer, NodeId, Packet, SimEvent, Stage, Target, Tone, WorldPatch } from './types'

export interface Narration {
  beginner: string
  technical: string
  why?: string
  analogy?: string
}

export type PacketSpec = Omit<Packet, 'id' | 'fate' | 'retransmission'>

interface EventOpts {
  tone?: Tone
  onStart?: WorldPatch
  onEnd?: WorldPatch
}

/**
 * Accumulates SimEvents and keeps the simulated clock. Stage builders
 * (dns.ts, tcp.ts, tls.ts, http.ts) call it in protocol order.
 */
export class JourneyBuilder {
  readonly events: SimEvent[] = []
  /** Simulated time in ms. */
  now = 0
  private readonly rng: () => number
  private counter = 0

  constructor(
    readonly config: JourneyConfig,
    readonly target: Target,
  ) {
    this.rng = createRng(hash(`${config.seed}|${target.host}|${config.lossPercent}`))
  }

  latency(a: NodeId, b: NodeId): number {
    return oneWayLatency(a, b, this.config.latencyMs)
  }

  /** Round-trip time between the client and the server. */
  get rtt(): number {
    return 2 * this.config.latencyMs
  }

  /** Whether random packet loss hits the next transmission. */
  rollLoss(): boolean {
    if (this.config.lossPercent <= 0) return false
    return this.rng() * 100 < this.config.lossPercent
  }

  local(stage: Stage, actor: NodeId, title: string, text: Narration, opts: EventOpts & { duration?: number; skipsTime?: boolean } = {}): SimEvent {
    const event: SimEvent = {
      id: `e${++this.counter}`,
      stage,
      kind: 'local',
      actor,
      title,
      t: this.now,
      duration: opts.duration ?? 0,
      beginner: text.beginner,
      technical: text.technical,
      why: text.why,
      analogy: text.analogy,
      tone: opts.tone ?? 'info',
      onStart: opts.onStart,
      onEnd: opts.onEnd,
      skipsTime: opts.skipsTime,
    }
    this.events.push(event)
    this.now += event.duration
    return event
  }

  /**
   * Sends one packet. `at` lets several packets leave at the same moment
   * (a server sending its whole TLS flight back to back).
   */
  packet(
    stage: Stage,
    spec: PacketSpec,
    opts: EventOpts & { at?: number; fate?: Fate; retransmission?: boolean; title?: string; text?: Narration } = {},
  ): SimEvent {
    const fate = opts.fate ?? 'delivered'
    const t = opts.at ?? this.now
    const travel = this.latency(spec.from, spec.to)
    const packet: Packet = { ...spec, id: `p${++this.counter}`, fate, retransmission: opts.retransmission ?? false }
    const prefix = packet.retransmission ? 'Retransmitted ' : ''
    const event: SimEvent = {
      id: `e${this.counter}`,
      stage,
      kind: 'packet',
      actor: spec.from,
      title: opts.title ?? `${prefix}${spec.label}`,
      packet,
      t,
      duration: travel,
      beginner: opts.text?.beginner ?? spec.beginner.what,
      technical: opts.text?.technical ?? spec.technical.what,
      tone: opts.tone ?? (fate === 'delivered' ? 'info' : 'warning'),
      onStart: opts.onStart,
      onEnd: fate === 'delivered' ? opts.onEnd : undefined,
    }
    this.events.push(event)
    if (fate === 'delivered') this.now = Math.max(this.now, t + travel)
    else this.now = Math.max(this.now, t)
    return event
  }

  /**
   * Sends a packet that will be retransmitted until it arrives. Losses come
   * from the scenario (`forcedLosses`) or from random loss. After a loss the
   * sender waits for its retransmission timer (`rto`), which doubles each time
   * (exponential backoff, RFC 6298). Returns the delivered event.
   */
  reliable(
    stage: Stage,
    make: (attempt: number) => PacketSpec,
    opts: EventOpts & {
      rto: number
      forcedLosses?: number
      at?: number
      timerText: (rto: number, attempt: number) => Narration
      lostText?: Narration
      title?: string
      text?: Narration
    },
  ): SimEvent {
    let rto = opts.rto
    for (let attempt = 0; ; attempt++) {
      const spec = make(attempt)
      const forced = attempt < (opts.forcedLosses ?? 0)
      // Cap random losses so a high loss rate still produces a finite journey.
      const lost = forced || (attempt < 3 && this.rollLoss())
      const at = attempt === 0 ? opts.at : undefined
      if (!lost) {
        return this.packet(stage, spec, { ...opts, at, retransmission: attempt > 0 })
      }
      this.packet(stage, spec, {
        at,
        fate: 'lost',
        retransmission: attempt > 0,
        onStart: opts.onStart,
        title: `${attempt > 0 ? 'Retransmitted ' : ''}${spec.label} (lost)`,
        text: opts.lostText ?? {
          beginner: `The ${spec.label} packet is lost on the way. Nobody tells the sender: it only notices because no reply arrives.`,
          technical: `${spec.label} dropped in transit (simulated loss). The receiver never sees it, so no acknowledgment comes back.`,
        },
        tone: 'warning',
      })
      this.local(stage, spec.from, `Retransmission timer expires (${formatMs(rto)})`, opts.timerText(rto, attempt), {
        duration: rto,
        tone: 'warning',
      })
      rto *= 2
    }
  }
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${+(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)} s`
  return `${+ms.toFixed(1)} ms`
}

// ---------------------------------------------------------------------------
// Layer helpers. These keep header fields consistent everywhere.

/** NAT notes for packets that cross the home router. See docs/decisions/0014-addresses-as-seen-by-the-client.md. */
export function natOut(publicPort: number): { src: string } {
  return { src: `Your router rewrites this to 198.51.100.7:${publicPort} before the packet leaves your home network (NAT).` }
}

export function natIn(publicPort: number): { dst: string } {
  return { dst: `On the internet this packet is addressed to 198.51.100.7:${publicPort}; your router translates it back (NAT).` }
}

export function ipv4(
  src: string,
  dst: string,
  protocol: 'UDP' | 'TCP',
  totalLength: number,
  notes: { src?: string; dst?: string } = {},
): Layer {
  return {
    name: 'IPv4',
    protocol: 'ip',
    fields: [
      { name: 'Source address', value: src, note: notes.src },
      { name: 'Destination address', value: dst, note: notes.dst },
      { name: 'Protocol', value: protocol === 'UDP' ? '17 (UDP)' : '6 (TCP)' },
      { name: 'TTL', value: '64', note: 'Each router decrements this by 1 and drops the packet at 0, so packets cannot loop forever.' },
      { name: 'Total length', value: `${totalLength} bytes` },
    ],
  }
}

export function udp(src: Endpoint, dst: Endpoint, payload: number): Layer {
  return {
    name: 'UDP',
    protocol: 'udp',
    fields: [
      { name: 'Source port', value: String(src.port) },
      { name: 'Destination port', value: String(dst.port), note: dst.port === 53 ? 'Port 53 is DNS.' : undefined },
      { name: 'Length', value: `${8 + payload} bytes`, note: '8-byte UDP header plus the DNS message.' },
    ],
  }
}

export interface TcpFields {
  seq: number
  ack?: number
  flags: string[]
  window: string
  payload: number
  options?: string
  segments?: number
}

export function tcp(src: Endpoint, dst: Endpoint, f: TcpFields): Layer {
  const fields = [
    { name: 'Source port', value: String(src.port) },
    { name: 'Destination port', value: String(dst.port) },
    {
      name: 'Sequence number',
      value: String(f.seq),
      note: f.payload > 0 ? `Covers bytes ${f.seq}–${f.seq + f.payload - 1}. Next sequence number: ${f.seq + f.payload}.` : undefined,
    },
    f.ack !== undefined
      ? { name: 'Acknowledgment number', value: String(f.ack), note: 'The next byte this side expects to receive.' }
      : { name: 'Acknowledgment number', value: '0', note: 'Not valid yet: the ACK flag is not set.' },
    { name: 'Flags', value: f.flags.join(', ') },
    { name: 'Window', value: f.window },
  ]
  if (f.options) fields.push({ name: 'Options', value: f.options })
  if (f.payload > 0) {
    fields.push({
      name: 'Payload',
      value: `${f.payload} bytes`,
      note: f.segments && f.segments > 1 ? `Too big for one segment (MSS 1460), so it travels as ${f.segments} TCP segments. Shown as one packet here.` : undefined,
    })
  }
  return { name: 'TCP', protocol: 'tcp', fields }
}

export function segmentsFor(payload: number): number {
  return Math.max(1, Math.ceil(payload / 1460))
}

/** IPv4 total length for a TCP packet: 20 IP + TCP header + payload (first segment only). */
export function tcpTotalLength(headerBytes: number, payload: number): number {
  return 20 + headerBytes + Math.min(payload, 1460)
}

export function explain(beginner: Explanation, technical: Explanation) {
  return { beginner, technical }
}

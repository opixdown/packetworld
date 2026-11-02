// Core types for the PacketWorld simulation model.
//
// The model is event based: a journey is an ordered list of SimEvents. Each event
// is either a packet travelling between two nodes or a local action on one node
// (a cache lookup, a certificate check). Events carry patches to the WorldState,
// so any step can be shown, paused, inspected or replayed deterministically.
// See docs/SIMULATION_MODEL.md.

export type NodeId = 'client' | 'router' | 'resolver' | 'root' | 'tld' | 'auth' | 'server'

export type Stage = 'dns' | 'tcp' | 'tls' | 'http'

/** Colour category. Every protocol has one consistent colour across the app. */
export type Protocol = 'dns' | 'tcp' | 'udp' | 'tls' | 'http' | 'ip' | 'error'

export type TcpState = 'CLOSED' | 'LISTEN' | 'SYN-SENT' | 'SYN-RECEIVED' | 'ESTABLISHED'

export type Mode = 'beginner' | 'technical'

export interface Endpoint {
  ip: string
  port: number
}

export interface Field {
  name: string
  value: string
  /** Short technical note shown under the value. */
  note?: string
}

export interface Layer {
  /** e.g. "IPv4", "UDP", "TCP", "DNS", "TLS 1.3", "HTTP/1.1" */
  name: string
  protocol: Protocol
  fields: Field[]
  /** True when this layer is encrypted on the wire (an observer cannot read it). */
  encrypted?: boolean
}

/**
 * What happens to a packet:
 * - delivered: it arrives.
 * - lost: it disappears in transit (congestion, a bad link).
 * - ignored: it arrives but nothing answers (server down, firewall silently dropping).
 */
export type Fate = 'delivered' | 'lost' | 'ignored'

export interface Explanation {
  what: string
  why: string
  analogy?: string
}

export interface Packet {
  id: string
  /** Short label drawn on the packet, e.g. "SYN" or "Client Hello". */
  label: string
  protocol: Protocol
  from: NodeId
  to: NodeId
  src: Endpoint
  dst: Endpoint
  transport: 'UDP' | 'TCP'
  /** Ordered outermost first: IPv4, then UDP/TCP, then the application layer. */
  layers: Layer[]
  /** Transport payload size in bytes (0 for a bare TCP control segment). */
  payloadBytes: number
  /** True when the application payload is encrypted. */
  encrypted: boolean
  fate: Fate
  retransmission: boolean
  beginner: Explanation
  technical: Explanation
  /** For encrypted packets: the metadata an on-path observer can still see. */
  observerSees?: string[]
}

export type Tone = 'info' | 'success' | 'warning' | 'error'

export type BrowserView =
  | 'blank'
  | 'resolving'
  | 'connecting'
  | 'securing'
  | 'waiting'
  | 'html'
  | 'rendered'
  | 'error'

export interface BrowserError {
  title: string
  code: string
  detail: string
}

export interface WorldState {
  tcpClient: TcpState
  tcpServer: TcpState
  tls: 'none' | 'negotiating' | 'secure' | 'failed' | 'not-used'
  resolvedIp: string | null
  browser: BrowserView
  error: BrowserError | null
  httpStatus: number | null
  /** Which resources the page has received, for the rendering preview. */
  resources: string[]
}

export type WorldPatch = Partial<WorldState>

export interface SimEvent {
  id: string
  stage: Stage
  kind: 'packet' | 'local'
  /** The node acting. For packets this is the sender. */
  actor: NodeId
  title: string
  packet?: Packet
  /** Simulated start time in ms since the journey began. */
  t: number
  /** Simulated duration in ms (travel time for packets, processing or waiting for local events). */
  duration: number
  beginner: string
  technical: string
  /** Optional extras for the step card: why this step exists, and a real-life comparison. */
  why?: string
  analogy?: string
  tone: Tone
  /** Applied when the event starts (e.g. the sender changes TCP state when it sends). */
  onStart?: WorldPatch
  /** Applied when the event completes; skipped for packets that are lost or ignored. */
  onEnd?: WorldPatch
  /** True when the simulated clock skips time that is not animated step by step. */
  skipsTime?: boolean
}

export interface StageSpan {
  stage: Stage
  firstIndex: number
  lastIndex: number
  start: number
  end: number
}

export type Outcome = 'success' | 'dns-failed' | 'timeout' | 'cert-failed' | 'http-error'

export interface Target {
  input: string
  url: string
  scheme: 'https' | 'http'
  host: string
  port: number
  path: string
  /** Registrable domain (simplified to the last two labels). */
  zone: string
  tld: string
  serverIp: string
  /** True when the host is an IPv4 literal, so no DNS lookup happens. */
  isIpLiteral: boolean
}

export interface Journey {
  target: Target
  events: SimEvent[]
  stages: StageSpan[]
  outcome: Outcome
  /** Initial world before the first event. */
  initial: WorldState
  /** Notes about simplifications or config interactions to show the user. */
  notes: string[]
}

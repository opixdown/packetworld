import { ipv4, natIn, natOut, segmentsFor, tcp, tcpTotalLength, type PacketSpec } from '../builder'
import { ADDR, PORTS } from '../topology'
import type { Endpoint, Explanation, Layer, Target } from '../types'

// Builds TCP segments between the client and the web server. TCP, TLS and HTTP
// packets all go through here, so ports, NAT notes and windows stay consistent.

export const CLIENT_ISN = 1000
export const SERVER_ISN = 5000

export const WINDOW = {
  clientSyn: '64240 bytes',
  serverSyn: '65160 bytes',
  client: '502 (× 128 scale = 64,256 bytes)',
  server: '509 (× 128 scale = 65,152 bytes)',
}

export const SYN_OPTIONS = 'MSS 1460, SACK permitted, window scale 7'

export function endpoints(target: Target): { client: Endpoint; server: Endpoint } {
  return {
    client: { ip: ADDR.client, port: PORTS.clientTcp },
    server: { ip: target.serverIp, port: target.port },
  }
}

export function segment(
  target: Target,
  o: {
    dir: 'up' | 'down'
    label: string
    seq: number
    ack?: number
    flags: string[]
    payload?: number
    app?: Layer
    encrypted?: boolean
    beginner: Explanation
    technical: Explanation
    observerSees?: string[]
  },
): PacketSpec {
  const { client, server } = endpoints(target)
  const up = o.dir === 'up'
  const src = up ? client : server
  const dst = up ? server : client
  const payload = o.payload ?? 0
  const syn = o.flags.includes('SYN')
  const header = syn ? 32 : 20
  const window = syn ? (up ? WINDOW.clientSyn : WINDOW.serverSyn) : up ? WINDOW.client : WINDOW.server
  const layers: Layer[] = [
    ipv4(src.ip, dst.ip, 'TCP', tcpTotalLength(header, payload), up ? natOut(PORTS.natTcp) : natIn(PORTS.natTcp)),
    tcp(src, dst, {
      seq: o.seq,
      ack: o.ack,
      flags: o.flags,
      window,
      payload,
      options: syn ? SYN_OPTIONS : undefined,
      segments: segmentsFor(payload),
    }),
  ]
  if (o.app) layers.push(o.app)
  return {
    label: o.label,
    protocol: o.app?.protocol ?? 'tcp',
    from: up ? 'client' : 'server',
    to: up ? 'server' : 'client',
    src,
    dst,
    transport: 'TCP',
    payloadBytes: payload,
    encrypted: o.encrypted ?? false,
    layers,
    beginner: o.beginner,
    technical: o.technical,
    observerSees: o.observerSees,
  }
}

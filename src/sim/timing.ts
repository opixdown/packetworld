import type { Journey } from './types'

export interface TimingRow {
  key: 'dns' | 'tcp' | 'tls' | 'ttfb' | 'download' | 'render'
  label: string
  start: number
  end: number
}

export interface TimingSummary {
  rows: TimingRow[]
  total: number
  packets: number
  lost: number
  retransmissions: number
}

/**
 * Splits a journey's simulated time into the phases a browser's network panel
 * would show. "TTFB" runs from sending the HTML request to its first byte arriving.
 */
export function summarize(journey: Journey): TimingSummary {
  const rows: TimingRow[] = []
  const span = (stage: 'dns' | 'tcp' | 'tls') => journey.stages.find((s) => s.stage === stage)
  const dns = span('dns')
  const tcp = span('tcp')
  const tls = span('tls')
  if (dns) rows.push({ key: 'dns', label: 'DNS lookup', start: dns.start, end: dns.end })
  if (tcp) rows.push({ key: 'tcp', label: 'TCP handshake', start: tcp.start, end: tcp.end })
  if (tls && tls.end > tls.start) rows.push({ key: 'tls', label: 'TLS handshake', start: tls.start, end: tls.end })

  const http = journey.events.filter((e) => e.stage === 'http')
  const request = http.find((e) => e.kind === 'packet' && e.packet?.from === 'client' && e.packet.fate === 'delivered')
  const response = http.find((e) => e.kind === 'packet' && e.packet?.from === 'server' && e.packet.fate === 'delivered')
  if (request && response) {
    const firstSend = http.find((e) => e.kind === 'packet')!.t
    rows.push({ key: 'ttfb', label: 'Waiting (TTFB)', start: firstSend, end: response.t + response.duration })
    const last = http[http.length - 1]
    const lastPacket = [...http].reverse().find((e) => e.kind === 'packet' && e.packet?.fate === 'delivered')!
    const dlEnd = lastPacket.t + lastPacket.duration
    if (dlEnd > response.t + response.duration) {
      rows.push({ key: 'download', label: 'Sub-resources', start: response.t + response.duration, end: dlEnd })
    }
    if (last.kind === 'local' && last.title === 'Page rendered') rows.push({ key: 'render', label: 'Render', start: last.t, end: last.t + last.duration })
  }

  const packets = journey.events.filter((e) => e.kind === 'packet')
  const end = journey.events.reduce((m, e) => Math.max(m, e.t + e.duration), 0)
  return {
    rows,
    total: end,
    packets: packets.length,
    lost: packets.filter((e) => e.packet!.fate !== 'delivered').length,
    retransmissions: packets.filter((e) => e.packet!.retransmission).length,
  }
}

/** Number of client↔server round trips before the first byte of HTML, for the main protocol stacks. */
export const ROUND_TRIPS = {
  'HTTP/1.1 or HTTP/2 over TLS 1.3 over TCP': { setup: 2, label: '1 RTT TCP + 1 RTT TLS, then 1 RTT for the request' },
  'HTTP/1.1 or HTTP/2 over TLS 1.2 over TCP': { setup: 3, label: '1 RTT TCP + 2 RTT TLS, then 1 RTT for the request' },
  'HTTP/3 over QUIC (UDP)': { setup: 1, label: 'QUIC combines transport and TLS 1.3 setup in 1 RTT, then 1 RTT for the request' },
  'HTTP/3 with 0-RTT resumption': { setup: 0, label: 'A returning visitor can send the request in the very first flight' },
} as const

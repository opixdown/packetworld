import { describe, expect, it } from 'vitest'
import { DNS_CACHE_OPTIONS, SCENARIO_OPTIONS } from './config'
import { buildJourney, sliceJourney, worldTimeline } from './journey'
import { STYLE_CSS, pageHtml, utf8Length } from './stages/http'
import { parseTarget, TargetError } from './target'
import { summarize } from './timing'
import { ADDR } from './topology'
import type { Journey, Packet } from './types'

const packets = (j: Journey) => j.events.filter((e) => e.kind === 'packet').map((e) => e.packet!)
const field = (p: Packet, layer: string, name: string) => p.layers.find((l) => l.name === layer)?.fields.find((f) => f.name === name)?.value
const num = (p: Packet, name: string) => Number(field(p, 'TCP', name))
const finalWorld = (j: Journey) => worldTimeline(j).at(-1)!

describe('target parsing', () => {
  it('adds https and derives a documentation-range address', () => {
    const t = parseTarget('example.com')
    expect(t.scheme).toBe('https')
    expect(t.port).toBe(443)
    expect(t.path).toBe('/')
    expect(t.serverIp).toMatch(/^203\.0\.113\.\d+$/)
  })

  it('keeps the same address for the same zone', () => {
    expect(parseTarget('www.example.com').serverIp).toBe(parseTarget('example.com').serverIp)
  })

  it('rejects names without a dot and non-web schemes', () => {
    expect(() => parseTarget('localhost')).toThrow(TargetError)
    expect(() => parseTarget('ftp://example.com')).toThrow(TargetError)
  })
})

describe('default journey', () => {
  const j = buildJourney()

  it('succeeds and runs the stages in protocol order', () => {
    expect(j.outcome).toBe('success')
    expect(j.stages.map((s) => s.stage)).toEqual(['dns', 'tcp', 'tls', 'http'])
    expect(finalWorld(j)).toMatchObject({ browser: 'rendered', tls: 'secure', tcpClient: 'ESTABLISHED', tcpServer: 'ESTABLISHED', httpStatus: 200 })
  })

  it('is deterministic', () => {
    expect(buildJourney()).toEqual(j)
  })

  it('never moves the clock backwards', () => {
    j.events.forEach((e, i) => {
      if (i > 0) expect(e.t).toBeGreaterThanOrEqual(j.events[i - 1].t)
    })
  })

  it('uses the right addresses on every packet', () => {
    for (const p of packets(j)) {
      if (p.from === 'client') expect(p.src.ip).toBe(ADDR.client)
      if (p.to === 'client') expect(p.dst.ip).toBe(ADDR.client)
      if (p.to === 'server') expect(p.dst).toEqual({ ip: j.target.serverIp, port: 443 })
      if (p.from === 'server') expect(p.src).toEqual({ ip: j.target.serverIp, port: 443 })
    }
  })

  it('shows the textbook handshake values', () => {
    const tcp = packets(j).filter((p) => p.transport === 'TCP')
    const [syn, synAck, ack, clientHello, serverHello] = tcp
    expect([syn.label, num(syn, 'Sequence number')]).toEqual(['SYN', 1000])
    expect([synAck.label, num(synAck, 'Sequence number'), num(synAck, 'Acknowledgment number')]).toEqual(['SYN-ACK', 5000, 1001])
    expect([ack.label, num(ack, 'Sequence number'), num(ack, 'Acknowledgment number')]).toEqual(['ACK', 1001, 5001])
    expect([clientHello.label, num(clientHello, 'Sequence number')]).toEqual(['Client Hello', 1001])
    expect(num(serverHello, 'Acknowledgment number')).toBe(1001 + 517)
  })
})

/**
 * Walks the TCP packets of a journey the way a receiver would:
 * - new data starts exactly at the highest sequence number sent so far (SND.NXT),
 * - a retransmission reuses the sequence number of an earlier segment,
 * - an acknowledgment never covers bytes the other side has not delivered.
 */
function checkSequenceNumbers(j: Journey) {
  const sent = { client: -1, server: -1 }
  const delivered = { client: -1, server: -1 }
  const seen = { client: new Set<number>(), server: new Set<number>() }
  for (const p of packets(j).filter((p) => p.transport === 'TCP')) {
    const side = p.from as 'client' | 'server'
    const other = side === 'client' ? 'server' : 'client'
    const seq = num(p, 'Sequence number')
    const flags = field(p, 'TCP', 'Flags')!
    if (sent[side] < 0) sent[side] = seq
    if (p.retransmission) expect(seen[side].has(seq), `${p.label} retransmits a known seq`).toBe(true)
    else expect(seq, `${p.label} seq`).toBe(sent[side])
    if (flags.includes('ACK')) expect(num(p, 'Acknowledgment number'), `${p.label} ack`).toBeLessThanOrEqual(delivered[other])
    const end = seq + p.payloadBytes + (flags.includes('SYN') ? 1 : 0)
    seen[side].add(seq)
    sent[side] = Math.max(sent[side], end)
    if (p.fate === 'delivered') delivered[side] = Math.max(delivered[side], end)
  }
}

describe('sequence number consistency', () => {
  it.each(SCENARIO_OPTIONS.map((s) => s.value))('holds in scenario %s', (scenario) => {
    checkSequenceNumbers(buildJourney({ scenario }))
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('holds with 25%% random loss, seed %i', (seed) => {
    const j = buildJourney({ lossPercent: 25, seed })
    checkSequenceNumbers(j)
    expect(j.outcome).toBe('success')
  })
})

describe('DNS cache modes', () => {
  const dnsPackets = (mode: (typeof DNS_CACHE_OPTIONS)[number]['value']) =>
    packets(buildJourney({ dnsCache: mode })).filter((p) => p.protocol === 'dns')

  it('only walks the full hierarchy with a cold cache', () => {
    expect(dnsPackets('cold').some((p) => p.to === 'root')).toBe(true)
    expect(dnsPackets('tld-cached').some((p) => p.to === 'root')).toBe(false)
    expect(dnsPackets('tld-cached').some((p) => p.to === 'tld')).toBe(true)
  })

  it('needs one round trip when the resolver has the answer', () => {
    expect(dnsPackets('resolver-cached').map((p) => `${p.from}>${p.to}`)).toEqual(['client>resolver', 'resolver>client'])
  })

  it('sends no DNS packets on a local cache hit', () => {
    expect(dnsPackets('os-cached')).toHaveLength(0)
    expect(dnsPackets('browser-cached')).toHaveLength(0)
  })

  it('uses a recursive query from the client and iterative ones from the resolver', () => {
    for (const p of dnsPackets('cold').filter((p) => !field(p, 'DNS', 'Flags')!.startsWith('Response'))) {
      expect(field(p, 'DNS', 'Flags')).toContain(p.from === 'client' ? 'RD=1' : 'RD=0')
    }
  })
})

describe('failure scenarios', () => {
  it('stops after DNS when the domain does not exist', () => {
    const j = buildJourney({ scenario: 'dns-nxdomain' })
    expect(j.outcome).toBe('dns-failed')
    expect(j.events.every((e) => e.stage === 'dns')).toBe(true)
    expect(finalWorld(j).error?.code).toBe('DNS_PROBE_FINISHED_NXDOMAIN')
  })

  it('retransmits a lost SYN with the same sequence number after 1 s', () => {
    const syns = packets(buildJourney({ scenario: 'syn-lost' })).filter((p) => p.label === 'SYN')
    expect(syns.map((p) => [p.fate, p.retransmission])).toEqual([
      ['lost', false],
      ['delivered', true],
    ])
    const j = buildJourney({ scenario: 'syn-lost' })
    const [first, second] = j.events.filter((e) => e.packet?.label === 'SYN')
    expect(second.t - first.t).toBe(1000)
  })

  it('recovers from a lost SYN-ACK by retransmitting the SYN', () => {
    const labels = packets(buildJourney({ scenario: 'synack-lost' })).filter((p) => p.transport === 'TCP').slice(0, 4)
    expect(labels.map((p) => `${p.label}:${p.fate}`)).toEqual(['SYN:delivered', 'SYN-ACK:lost', 'SYN:delivered', 'SYN-ACK:delivered'])
  })

  it('completes the handshake with the next data segment when the final ACK is lost', () => {
    const j = buildJourney({ scenario: 'ack-lost' })
    const worlds = worldTimeline(j)
    const ackIndex = j.events.findIndex((e) => e.packet?.label === 'ACK')
    expect(worlds[ackIndex + 1].tcpServer).toBe('SYN-RECEIVED')
    const helloIndex = j.events.findIndex((e) => e.packet?.label === 'Client Hello')
    expect(worlds[helloIndex + 1].tcpServer).toBe('ESTABLISHED')
    expect(j.outcome).toBe('success')
  })

  it('gives up after the Linux SYN retry budget when the server is silent', () => {
    const j = buildJourney({ scenario: 'server-timeout' })
    expect(j.outcome).toBe('timeout')
    const firstSyn = j.events.find((e) => e.packet?.label === 'SYN')!
    expect(summarize(j).total).toBe(firstSyn.t + 127000)
    expect(finalWorld(j).error?.code).toBe('ERR_CONNECTION_TIMED_OUT')
  })

  it('aborts before any HTTP when the certificate is invalid', () => {
    const j = buildJourney({ scenario: 'tls-invalid-cert' })
    expect(j.outcome).toBe('cert-failed')
    expect(j.events.some((e) => e.stage === 'http')).toBe(false)
    expect(finalWorld(j).tls).toBe('failed')
  })

  it('returns a 404 page over a working connection', () => {
    const j = buildJourney({ scenario: 'http-404' })
    expect(j.outcome).toBe('http-error')
    expect(finalWorld(j)).toMatchObject({ httpStatus: 404, tls: 'secure' })
  })
})

describe('protocol variants', () => {
  it('skips TLS for plain http and uses port 80', () => {
    const j = buildJourney({ url: 'http://example.com' })
    expect(packets(j).some((p) => p.protocol === 'tls')).toBe(false)
    expect(packets(j).filter((p) => p.to === 'server').every((p) => p.dst.port === 80)).toBe(true)
    expect(finalWorld(j).tls).toBe('not-used')
  })

  it('skips DNS for an IP literal', () => {
    const j = buildJourney({ url: 'https://203.0.113.50/' })
    expect(packets(j).some((p) => p.protocol === 'dns')).toBe(false)
  })

  it('marks HTTP over TLS as encrypted', () => {
    const http = packets(buildJourney()).filter((p) => p.protocol === 'http')
    expect(http.length).toBeGreaterThan(0)
    expect(http.every((p) => p.encrypted && p.layers.some((l) => l.name === 'TLS record'))).toBe(true)
  })

  it('reports Content-Length values that match the bodies', () => {
    const bodies = packets(buildJourney())
      .filter((p) => p.label.startsWith('200'))
      .map((p) => Number(field(p, 'HTTP/1.1', 'Content-Length')!.replace(/\D/g, '')))
    expect(bodies).toEqual([utf8Length(pageHtml('example.com')), utf8Length(STYLE_CSS)])
  })
})

describe('timing', () => {
  it('adds about one RTT per extra 2× latency step', () => {
    const fast = summarize(buildJourney({ latencyMs: 20, dnsCache: 'os-cached' })).total
    const slow = summarize(buildJourney({ latencyMs: 120, dnsCache: 'os-cached' })).total
    // Handshake (1 RTT) + TLS (1 RTT) + HTML (1 RTT) + CSS (1 RTT) = 4 round trips.
    expect(slow - fast).toBeCloseTo(4 * 2 * 100, 0)
  })

  it('slices a single stage with a consistent starting world', () => {
    const tls = sliceJourney(buildJourney(), ['tls'])
    expect(tls.events.every((e) => e.stage === 'tls')).toBe(true)
    expect(tls.events[0].t).toBe(0)
    expect(tls.initial.tcpClient).toBe('ESTABLISHED')
  })
})

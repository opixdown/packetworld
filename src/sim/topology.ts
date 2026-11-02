import type { NodeId, Target } from './types'

// Addresses used by the simulation. Everything except the root server comes
// from ranges reserved for documentation or private networks, so nothing here
// points at a real machine. a.root-servers.net is real and stable, and showing
// it teaches that root servers are well-known fixed addresses.
// See docs/decisions/0007-documentation-ip-addresses.md.

export const ADDR = {
  client: '192.168.1.23',
  routerLan: '192.168.1.1',
  routerWan: '198.51.100.7',
  resolver: '192.0.2.53',
  root: '198.41.0.4',
  tldCom: '192.5.6.30',
  tldOther: '192.0.2.30',
  auth: '192.0.2.80',
} as const

export const PORTS = {
  clientDns: 53001,
  resolverOut: 41862,
  clientTcp: 52144,
  natTcp: 40112,
  natDns: 40113,
} as const

export interface NodeAddressing {
  name: string
  hostname?: string
  ip: string
}

export function tldServerName(tld: string): string {
  return tld === 'com' || tld === 'net' ? 'a.gtld-servers.net' : `a.nic.${tld}`
}

export function tldServerIp(tld: string): string {
  return tld === 'com' || tld === 'net' ? ADDR.tldCom : ADDR.tldOther
}

export function authServerName(target: Target): string {
  return `ns1.${target.zone}`
}

export function addressing(target: Target): Record<NodeId, NodeAddressing> {
  return {
    client: { name: 'Your browser', ip: ADDR.client },
    router: { name: 'Home router', ip: `${ADDR.routerLan} / ${ADDR.routerWan}` },
    resolver: { name: 'DNS resolver', ip: ADDR.resolver },
    root: { name: 'Root server', hostname: 'a.root-servers.net', ip: ADDR.root },
    tld: { name: `TLD server (.${target.tld || 'com'})`, hostname: tldServerName(target.tld), ip: tldServerIp(target.tld) },
    auth: { name: 'Authoritative server', hostname: authServerName(target), ip: ADDR.auth },
    server: { name: 'Web server', hostname: target.host, ip: target.serverIp },
  }
}

/**
 * One-way latency between two nodes in ms. The client↔server path is the one
 * the user controls; the DNS infrastructure uses fixed, typical values.
 */
export function oneWayLatency(a: NodeId, b: NodeId, clientServerMs: number): number {
  const key = [a, b].sort().join('-')
  switch (key) {
    case 'client-server':
      return clientServerMs
    case 'client-resolver':
      return 8
    case 'resolver-root':
      return 12
    case 'resolver-tld':
      return 18
    case 'auth-resolver':
      return 24
    default:
      return 10
  }
}

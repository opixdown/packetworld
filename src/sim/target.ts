import { hash } from './random'
import type { Target } from './types'

export class TargetError extends Error {}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/

/**
 * Parses what the user typed into a Target. Nothing is looked up on the real
 * network: the server address is derived from the hostname, inside the
 * 203.0.113.0/24 documentation range (RFC 5737), so every domain gets a stable,
 * clearly fake address. See docs/decisions/0007-documentation-ip-addresses.md.
 */
export function parseTarget(input: string): Target {
  const raw = input.trim() || 'https://example.com'
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new TargetError('That does not look like a web address. Try something like example.com.')
  }
  const scheme = url.protocol.replace(':', '')
  if (scheme !== 'https' && scheme !== 'http') {
    throw new TargetError('PacketWorld simulates web pages, so use an http:// or https:// address.')
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  const isIpLiteral = IPV4.test(host)
  if (!isIpLiteral && !host.includes('.')) {
    throw new TargetError('Use a full domain name with a dot in it, like example.com.')
  }
  if (host.startsWith('[')) {
    throw new TargetError('IPv6 literals are not simulated yet. Try a domain name instead.')
  }
  const labels = host.split('.')
  const tld = isIpLiteral ? '' : labels[labels.length - 1]
  const zone = isIpLiteral ? host : labels.slice(-2).join('.')
  const serverIp = isIpLiteral ? host : `203.0.113.${10 + (hash(zone) % 240)}`
  const port = url.port ? Number(url.port) : scheme === 'https' ? 443 : 80
  return {
    input: raw,
    url: `${scheme}://${host}${url.port ? `:${url.port}` : ''}${url.pathname}${url.search}`,
    scheme: scheme as 'https' | 'http',
    host,
    port,
    path: `${url.pathname || '/'}${url.search}`,
    zone,
    tld,
    serverIp,
    isIpLiteral,
  }
}

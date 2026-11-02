import type { Protocol, Stage } from '../sim/types'

// The protocol colour language: an ink for lines and text, a highlighter tint
// for fills. The values are CSS variables defined per theme in src/index.css.

export const PROTOCOL_COLOR: Record<Protocol, string> = {
  dns: 'rgb(var(--pw-dns))',
  tcp: 'rgb(var(--pw-tcp))',
  udp: 'rgb(var(--pw-udp))',
  tls: 'rgb(var(--pw-tls))',
  http: 'rgb(var(--pw-http))',
  ip: 'rgb(var(--pw-ip))',
  error: 'rgb(var(--pw-error))',
}

export const PROTOCOL_TINT: Record<Protocol, string> = {
  dns: 'rgb(var(--pw-t-dns))',
  tcp: 'rgb(var(--pw-t-tcp))',
  udp: 'rgb(var(--pw-t-udp))',
  tls: 'rgb(var(--pw-t-tls))',
  http: 'rgb(var(--pw-t-http))',
  ip: 'rgb(var(--pw-t-ip))',
  error: 'rgb(var(--pw-t-error))',
}

/** Board and chalk, for SVG where Tailwind classes can't reach. Theme-aware via CSS variables. */
export const PAPER = {
  paper: 'rgb(var(--pw-paper))',
  paper2: 'rgb(var(--pw-paper-2))',
  card: 'rgb(var(--pw-card))',
  wash: 'rgb(var(--pw-wash))',
  rule: 'rgb(var(--pw-rule))',
  ruleStrong: 'rgb(var(--pw-rule-strong))',
  /** Outlines and offset edges. */
  edge: 'rgb(var(--pw-edge))',
  /** Text. */
  ink: 'rgb(var(--pw-fg))',
  muted: 'rgb(var(--pw-fg-muted))',
  faint: 'rgb(var(--pw-fg-faint))',
  warn: 'rgb(var(--pw-warn))',
  warnTint: 'rgb(var(--pw-t-warn))',
}

export const PROTOCOL_NAME: Record<Protocol, string> = {
  dns: 'DNS',
  tcp: 'TCP',
  udp: 'UDP',
  tls: 'TLS',
  http: 'HTTP',
  ip: 'IP',
  error: 'Alert',
}

export const STAGE_INFO: Record<Stage, { name: string; title: string; protocol: Protocol; blurb: string }> = {
  dns: { name: 'DNS', title: 'Finding the server', protocol: 'dns', blurb: 'Turn the name into an IP address.' },
  tcp: { name: 'TCP', title: 'Opening a connection', protocol: 'tcp', blurb: 'Three packets to agree to talk.' },
  tls: { name: 'TLS', title: 'Making it private', protocol: 'tls', blurb: 'Agree on keys, check the certificate.' },
  http: { name: 'HTTP', title: 'Asking for the page', protocol: 'http', blurb: 'Request, response, render.' },
}

/** Tailwind classes per protocol, written out in full so Tailwind can see them. */
export const PROTOCOL_CLASSES: Record<Protocol, { text: string; bg: string; border: string; dot: string; tint: string }> = {
  dns: { text: 'text-proto-dns', bg: 'bg-tint-dns/60', border: 'border-proto-dns/50', dot: 'bg-proto-dns', tint: 'bg-tint-dns' },
  tcp: { text: 'text-proto-tcp', bg: 'bg-tint-tcp/60', border: 'border-proto-tcp/50', dot: 'bg-proto-tcp', tint: 'bg-tint-tcp' },
  udp: { text: 'text-proto-udp', bg: 'bg-tint-udp/60', border: 'border-proto-udp/50', dot: 'bg-proto-udp', tint: 'bg-tint-udp' },
  tls: { text: 'text-proto-tls', bg: 'bg-tint-tls/60', border: 'border-proto-tls/50', dot: 'bg-proto-tls', tint: 'bg-tint-tls' },
  http: { text: 'text-proto-http', bg: 'bg-tint-http/60', border: 'border-proto-http/50', dot: 'bg-proto-http', tint: 'bg-tint-http' },
  ip: { text: 'text-proto-ip', bg: 'bg-tint-ip/60', border: 'border-proto-ip/50', dot: 'bg-proto-ip', tint: 'bg-tint-ip' },
  error: { text: 'text-proto-error', bg: 'bg-tint-error/60', border: 'border-proto-error/50', dot: 'bg-proto-error', tint: 'bg-tint-error' },
}

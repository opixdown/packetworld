import { Lock, Search, Server } from 'lucide-react'
import { parseTarget } from '../sim/target'
import { useTheme } from '../state/theme'
import { Bar, Roll, Stage, Window, type Act, type LookTokens } from '../vendor/stageshow'
import './hero.css'

// The landing page hero: a browser loads a page while its packets fly to a
// DNS resolver and a web server. Built with the Stageshow kit; the plan and
// review notes are in docs/design/LANDING_HERO.md.
//
// Beats: the address is typed and the page goes to its skeleton; a DNS query
// goes out and the answer lands as the server's address; SYN, SYN-ACK, ACK
// light the TCP row; Client Hello / Server Hello light TLS and the lock;
// GET and 200 OK light HTTP while the page resolves top to bottom. The result
// holds, then the address bar clears for the next site.
//
// Each loop types a different domain, so the cold DNS lookup stays honest:
// revisiting the same name would be answered from a cache.

type Proto = 'dns' | 'tcp' | 'tls' | 'http'
type Lane = 'dns' | 'srv'

interface Flight {
  id: number
  label: string
  proto: Proto
  lane: Lane
  dir: 'out' | 'in'
  lock?: boolean
}

interface S {
  typed: string
  page: 'blank' | 'skeleton' | 'loaded'
  ip: string
  tcp: string
  tls: string
  http: string
  secure: boolean
  resolver: boolean
  flight: Flight | null
}

const HOSTS = ['example.com', 'example.org', 'example.net']
const ipFor = (host: string) => parseTarget(host).serverIp
const DASH = '—'

const initial: S = { typed: '', page: 'blank', ip: DASH, tcp: DASH, tls: DASH, http: DASH, secure: false, resolver: false, flight: null }

const poster: S = {
  typed: HOSTS[0],
  page: 'loaded',
  ip: ipFor(HOSTS[0]),
  tcp: 'Established',
  tls: '1.3 · encrypted',
  http: '200 OK',
  secure: true,
  resolver: false,
  flight: null,
}

/** Real ms a packet takes to cross its lane. */
const FLY = 820
let loop = 0
let flightId = 0

async function fly(a: Act<S>, f: Omit<Flight, 'id'>, gap = 140) {
  a.put({ flight: { ...f, id: ++flightId } })
  await a.wait(FLY + gap)
}

async function script(a: Act<S>) {
  const host = HOSTS[loop++ % HOSTS.length]
  const ip = ipFor(host)

  await a.wait(500)
  await a.type('typed', host, { interval: 55 })
  await a.wait(260)
  await a.key('enter')
  a.put({ page: 'skeleton' })
  await a.wait(420)

  // DNS: the answer lands as the server's address
  await fly(a, { label: 'DNS query', proto: 'dns', lane: 'dns', dir: 'out' }, 0)
  a.put({ resolver: true })
  await a.wait(260)
  await fly(a, { label: ip, proto: 'dns', lane: 'dns', dir: 'in' }, 0)
  a.put({ resolver: false, ip })
  await a.wait(380)

  // TCP
  await fly(a, { label: 'SYN', proto: 'tcp', lane: 'srv', dir: 'out' }, 60)
  await fly(a, { label: 'SYN-ACK', proto: 'tcp', lane: 'srv', dir: 'in' }, 60)
  await fly(a, { label: 'ACK', proto: 'tcp', lane: 'srv', dir: 'out' }, 0)
  a.put({ tcp: 'Established' })
  await a.wait(300)

  // TLS 1.3: one round trip
  await fly(a, { label: 'Client Hello', proto: 'tls', lane: 'srv', dir: 'out' }, 60)
  await fly(a, { label: 'Server Hello', proto: 'tls', lane: 'srv', dir: 'in' }, 0)
  a.put({ tls: '1.3 · encrypted', secure: true })
  await a.wait(300)

  // HTTP, inside the encrypted connection
  await fly(a, { label: 'GET /', proto: 'http', lane: 'srv', dir: 'out', lock: true }, 60)
  await fly(a, { label: '200 OK', proto: 'http', lane: 'srv', dir: 'in', lock: true }, 0)
  a.put({ http: '200 OK', page: 'loaded', flight: null })

  // The payoff holds, then the address bar clears for the next site
  await a.wait(2400)
  await a.set({ ...initial })
  await a.wait(500)
}

export function HeroStage() {
  const { theme } = useTheme()
  return (
    <Stage<S>
      width={720}
      height={400}
      compact={{ below: 600, width: 358, height: 530 }}
      theme={theme}
      tokens={TOKENS}
      initial={initial}
      poster={poster}
      script={script}
      keys={{ wide: 'bottom-right', compact: 'bottom-right' }}
      className="pwh"
    >
      {(s) => (
        <>
          <Window
            className="pwh-win"
            urlShape="pill"
            url={
              <span className="pwh-url">
                <span className="pwh-lock" data-on={s.secure || undefined}>
                  <Lock size={11} strokeWidth={2.4} />
                </span>
                <span>{s.typed || <span className="pwh-url-empty">Search or type a URL</span>}</span>
              </span>
            }
          >
            <Page state={s.page} host={s.typed} />
          </Window>

          {/* Wires: each ends in a dot on the machine it reaches */}
          <div className="pwh-wire pwh-wire--dns" data-active={(s.flight?.lane === 'dns' && s.flight.proto) || undefined} />
          <div className="pwh-wire pwh-wire--srv" data-active={(s.flight?.lane === 'srv' && s.flight.proto) || undefined} />

          <div className="pwh-resolver" data-lit={s.resolver || undefined}>
            <Search size={14} strokeWidth={2} />
            <span>DNS resolver</span>
          </div>

          <div className="pwh-server">
            <div className="pwh-server__head">
              <span className="pwh-server__title">
                <Server size={14} strokeWidth={2} />
                Server
              </span>
              <span className="pwh-mono">
                <Roll>{s.ip}</Roll>
              </span>
            </div>
            <Row proto="tcp" label="TCP" value={s.tcp} />
            <Row proto="tls" label="TLS" value={s.tls} />
            <Row proto="http" label="HTTP" value={s.http} />
          </div>

          {s.flight && (
            <div key={s.flight.id} className="pwh-packet" data-lane={s.flight.lane} data-dir={s.flight.dir} data-proto={s.flight.proto} style={{ animationDuration: `${FLY}ms` }}>
              {s.flight.lock && <Lock size={10} strokeWidth={2.6} />}
              {s.flight.label}
            </div>
          )}
        </>
      )}
    </Stage>
  )
}

function Row({ proto, label, value }: { proto: Proto; label: string; value: string }) {
  return (
    <div className="pwh-row" data-proto={proto} data-on={value !== DASH || undefined}>
      <i className="pwh-dot" />
      <span className="pwh-row__label">{label}</span>
      <span className="pwh-row__value">
        <Roll variant="fade" align="end">
          {value}
        </Roll>
      </span>
    </div>
  )
}

/** The page inside the browser: empty tab, skeleton at the content's own geometry, then the content. */
function Page({ state, host }: { state: S['page']; host: string }) {
  const title = /^example\.(com|org|net)$/.test(host) ? 'Example Domain' : host
  return (
    <div className="pwh-page" data-state={state}>
      <div className="pwh-page__col">
        <div className="pwh-slot pwh-slot--h">
          <Bar w={150} h={14} r={4} className="pwh-skel" />
          <span className="pwh-real pwh-h">{title}</span>
        </div>
        <div className="pwh-slot pwh-slot--p">
          <Bar w={220} h={8} r={4} className="pwh-skel" />
          <span className="pwh-real pwh-p">This domain is for use in documentation examples without needing permission.</span>
        </div>
        <div className="pwh-slot pwh-slot--p2">
          <Bar w={190} h={8} r={4} className="pwh-skel" />
          <Bar w={120} h={8} r={4} className="pwh-real pwh-link" />
        </div>
        <div className="pwh-filler">
          {[200, 170, 220, 150, 190, 120].map((w, i) => (
            <Bar key={i} w={w} h={7} r={3.5} className="pwh-fill" />
          ))}
        </div>
      </div>
    </div>
  )
}

// PacketWorld's theme variables mapped onto the kit's tokens, so the hero follows light and dark.
const TOKENS: LookTokens = {
  '--ss-canvas': 'rgb(var(--pw-paper))',
  '--ss-well': 'rgb(var(--pw-paper-2))',
  '--ss-surface': 'rgb(var(--pw-card))',
  '--ss-chrome': 'rgb(var(--pw-wash))',
  '--ss-raised': 'rgb(var(--pw-card))',
  '--ss-fill': 'rgb(var(--pw-rule))',
  '--ss-text': 'rgb(var(--pw-fg-muted))',
  '--ss-text-strong': 'rgb(var(--pw-fg))',
  '--ss-text-faint': 'rgb(var(--pw-fg-faint))',
  '--ss-icon': 'rgb(var(--pw-fg))',
  '--ss-icon-faint': 'rgb(var(--pw-rule-strong))',
  '--ss-line': 'rgb(var(--pw-fg) / 0.14)',
  '--ss-line-faint': 'rgb(var(--pw-fg) / 0.08)',
  '--ss-accent': 'rgb(var(--pw-tcp))',
}

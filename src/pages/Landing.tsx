import { ArrowRight, BookOpen, FlaskConical, Route } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HeroStage } from '../landing/HeroStage'
import { cx } from '../lib/cx'
import { PROTOCOL_CLASSES } from '../lib/protocols'
import { REPO_URL } from '../lib/site'
import type { Protocol } from '../sim/types'

const STEPS: { n: number; proto: Protocol; name: string; title: string; text: string; packets: string[] }[] = [
  {
    n: 1,
    proto: 'dns',
    name: 'DNS',
    title: 'Find the server',
    text: 'Computers connect with numbers, not names. Your browser asks a chain of DNS servers (or a cache) for the IP address.',
    packets: ['DNS Query', 'A 203.0.113.10'],
  },
  {
    n: 2,
    proto: 'tcp',
    name: 'TCP',
    title: 'Open a connection',
    text: 'Three small packets let both sides agree to talk and choose starting numbers, so lost data can be noticed and resent.',
    packets: ['SYN', 'SYN-ACK', 'ACK'],
  },
  {
    n: 3,
    proto: 'tls',
    name: 'TLS',
    title: 'Make it private',
    text: 'One round trip agrees on a secret key and checks the server’s certificate. After this, nobody in between can read the data.',
    packets: ['Client Hello', 'Server Hello', 'Finished'],
  },
  {
    n: 4,
    proto: 'http',
    name: 'HTTP',
    title: 'Ask for the page',
    text: 'The browser requests the page, gets HTML back, finds the CSS, images and scripts it needs, and draws it on screen.',
    packets: ['GET /', '200 OK'],
  },
]

const PROMISES = [
  'DNS caching is shown. The full root → TLD → authoritative walk is the rare worst case, not the default story.',
  'TCP and TLS are separate handshakes, and the main example uses TLS 1.3: one round trip.',
  'TCP isn’t everything. DNS usually runs over UDP, and HTTP/3 runs over QUIC on UDP.',
  'Routers forward packets hop by hop using routing tables. The path isn’t a fixed line of boxes.',
  'Encryption hides content, not everything. You’ll see what an observer can still learn.',
  'Sequence numbers, ports and sizes stay consistent from the first packet to the last.',
]

export function LandingPage() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8 lg:pb-20 lg:pt-16">
        <div>
          <p className="mb-5 inline-block -rotate-1 rounded-sm border-[1.5px] border-edge bg-card px-2 py-1 font-mono text-xs font-semibold text-fg shadow-note-sm">
            The internet is not magic. See how it works.
          </p>
          <h1 className="text-[2.4rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.4rem]">
            You use the internet every day. But have you ever <span className="pw-mark italic">seen</span> how it works?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg">
            Explore DNS, TCP, TLS and HTTP through interactive simulations. Understand networking by watching packets travel across the internet.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/journey" className="pw-btn-primary">
              Explore the Internet <ArrowRight size={16} />
            </Link>
            <Link to="/learn" className="pw-btn-secondary">
              Start Learning
            </Link>
          </div>
          <p className="mt-5 text-xs text-fg-faint">Free and open source. No account needed. The packets are simulated, so it's safe to break things.</p>
        </div>
        <div className="-mx-4 sm:mx-0" aria-label="Animated preview: a browser loading a page while DNS, TCP, TLS and HTTP packets travel to a resolver and a server">
          <HeroStage />
        </div>
      </section>

      <section className="border-y-[1.5px] border-edge bg-card/70">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Four things happen every time you press Enter</h2>
          <p className="mt-2 max-w-2xl text-fg-muted">In less than a second, always in this order. PacketWorld lets you stop on each one and look closer.</p>
          <ol className="mt-8 grid gap-5 md:grid-cols-4">
            {STEPS.map((s) => {
              const c = PROTOCOL_CLASSES[s.proto]
              return (
                <li key={s.n} className="flex flex-col rounded-md border-[1.5px] border-edge bg-card p-5 shadow-note">
                  <div className="flex items-center gap-2.5">
                    <span className={cx('grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-edge font-display text-base font-semibold', c.tint)}>{s.n}</span>
                    <span className={cx('font-mono text-sm font-semibold', c.text)}>{s.name}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted">{s.text}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.packets.map((p) => (
                      <span key={p} className={cx('rounded border-[1.5px] px-2 py-0.5 font-mono text-xs font-semibold', c.border, c.text, c.tint)}>
                        {p}
                      </span>
                    ))}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Three ways in</h2>
          <ul className="mt-6 divide-y divide-rule border-y border-rule">
            <Entry to="/journey" icon={<Route size={18} />} title="Journey" text="Type a URL and follow every packet from your browser to the server and back. Pause, step, and inspect anything." />
            <Entry to="/playground" icon={<FlaskConical size={18} />} title="Playground" text="Add latency and packet loss, break DNS, expire a certificate, and watch how the journey changes." />
            <Entry to="/learn" icon={<BookOpen size={18} />} title="Learn" text="Ten short interactive lessons, from IP addresses to NAT, each with a quiz." />
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Simplified, never wrong</h2>
          <p className="mt-2 text-fg-muted">This is a teaching tool, so correctness comes before flashy animation. Some things we promise:</p>
          <ul className="mt-5 space-y-2.5">
            {PROMISES.map((p) => (
              <li key={p} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
                <span className="font-display font-semibold text-proto-http">✓</span>
                {p}
              </li>
            ))}
          </ul>
          <a href={`${REPO_URL}/blob/main/docs/ACCURACY.md`} className="pw-link mt-5 inline-block text-sm">
            Read every simplification we make
          </a>
        </div>
      </section>
    </div>
  )
}

function Entry({ to, icon, title, text }: { to: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <li>
      <Link to={to} className="group flex gap-4 py-4">
        <span className="mt-0.5 text-fg-faint group-hover:text-fg">{icon}</span>
        <span className="flex-1">
          <span className="flex items-center gap-2 font-display text-lg font-semibold">
            {title}
            <ArrowRight size={14} className="text-fg-faint transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-0.5 block text-sm text-fg-muted">{text}</span>
        </span>
      </Link>
    </li>
  )
}

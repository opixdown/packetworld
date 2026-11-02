import { Globe2, MonitorPlay, Wrench } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../lib/cx'
import type { Target } from '../sim/types'
import { DevToolsGuide } from './DevToolsGuide'
import { LiveDnsPanel } from './LiveDnsPanel'
import { RealPagePanel } from './RealPagePanel'

type Tab = 'dns' | 'page' | 'devtools'

const TABS: { id: Tab; label: string; icon: typeof Globe2 }[] = [
  { id: 'dns', label: 'Real address', icon: Globe2 },
  { id: 'page', label: 'Real page', icon: MonitorPlay },
  { id: 'devtools', label: 'See every request', icon: Wrench },
]

/** Everything that connects the simulation to the real internet, in one place. */
export function RealWorldPanel({ target }: { target: Target }) {
  const [tab, setTab] = useState<Tab>('dns')
  return (
    <section className="rounded-md border-[1.5px] border-edge bg-card shadow-note" aria-labelledby="real-world">
      <header className="border-b-[1.5px] border-edge px-4 pb-0 pt-4">
        <h2 id="real-world" className="text-2xl font-semibold">
          Now try it for real
        </h2>
        <p className="mt-1 text-sm text-fg-muted">Everything above is a simulation. These three tools show you the real internet.</p>
        <div role="tablist" aria-label="Real-world tools" className="-mb-[1.5px] mt-4 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'inline-flex shrink-0 items-center gap-1.5 rounded-t-md border-[1.5px] px-3 py-2 text-sm font-bold',
                tab === t.id ? 'border-edge border-b-card bg-card text-fg' : 'border-transparent text-fg-muted hover:text-fg',
              )}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </header>
      <div role="tabpanel" className="p-4">
        {tab === 'dns' && (target.isIpLiteral ? <p className="text-sm text-fg-muted">You typed an IP address, so there is no name to look up.</p> : <LiveDnsPanel target={target} />)}
        {tab === 'page' && <RealPagePanel target={target} />}
        {tab === 'devtools' && <DevToolsGuide target={target} />}
      </div>
    </section>
  )
}

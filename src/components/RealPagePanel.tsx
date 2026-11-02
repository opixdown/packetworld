import { ExternalLink, Lock, MonitorPlay, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Target } from '../sim/types'

/**
 * Shows the real, live website inside a browser frame, next to what the
 * simulation drew. Loading it is a real request, so it only happens on click.
 * The frame is sandboxed: no scripts, no forms, no access to PacketWorld.
 */
export function RealPagePanel({ target }: { target: Target }) {
  const [shown, setShown] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    setShown(false)
  }, [target.url])

  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">
        The simulation drew a pretend version of the page. Here you can load the <strong className="text-fg">real</strong> page from{' '}
        <span className="font-mono text-fg">{target.host}</span>, the way your browser would after DNS, TCP, TLS and HTTP all succeed.
      </p>
      {!shown ? (
        <button onClick={() => setShown(true)} className="pw-btn-primary py-2">
          <MonitorPlay size={16} /> Load the real page
        </button>
      ) : (
        <div className="overflow-hidden rounded-md border-[1.5px] border-edge bg-card shadow-note">
          <div className="flex items-center gap-2 border-b-[1.5px] border-edge bg-wash px-3 py-2">
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full border border-edge/40 bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full border border-edge/40 bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full border border-edge/40 bg-[#28c840]" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-edge/30 bg-card px-2.5 py-1 font-mono text-xs">
              {target.scheme === 'https' && <Lock size={12} className="shrink-0 text-proto-tls" />}
              <span className="truncate">{target.url}</span>
            </div>
            <button onClick={() => setReload((n) => n + 1)} className="grid h-7 w-7 place-items-center rounded hover:bg-card" aria-label="Reload the real page">
              <RotateCw size={14} />
            </button>
            <a href={target.url} target="_blank" rel="noopener noreferrer" className="grid h-7 w-7 place-items-center rounded hover:bg-card" aria-label="Open in a new tab">
              <ExternalLink size={14} />
            </a>
          </div>
          <iframe
            key={reload}
            title={`The real ${target.host}`}
            src={target.url}
            sandbox=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="block h-[360px] w-full bg-paper"
          />
        </div>
      )}
      <p className="text-xs leading-relaxed text-fg-faint">
        This loads the page from the real server, so that server sees your IP address, like any visit. The frame is locked down: scripts and forms
        are switched off. If it stays blank, the site doesn't allow being shown inside other pages (a security setting called
        <span className="font-mono"> frame-ancestors</span>). Use the open-in-new-tab button instead.
      </p>
    </div>
  )
}

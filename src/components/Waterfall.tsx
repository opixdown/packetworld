import { cx } from '../lib/cx'
import { formatMs } from '../sim/builder'
import type { TimingRow, TimingSummary } from '../sim/timing'

const COLORS: Record<TimingRow['key'], string> = {
  dns: 'bg-proto-dns',
  tcp: 'bg-proto-tcp',
  tls: 'bg-proto-tls',
  ttfb: 'bg-proto-http',
  download: 'bg-proto-http/60',
  render: 'bg-fg-muted',
}

/** A network-panel style waterfall of the simulated timings. */
export function Waterfall({ summary, scale, className }: { summary: TimingSummary; /** Shared max (ms) to compare two waterfalls. */ scale?: number; className?: string }) {
  const max = Math.max(scale ?? summary.total, 1)
  return (
    <div className={cx('space-y-1.5', className)}>
      {summary.rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-xs">
          <span className="truncate text-fg-muted">{r.label}</span>
          <div className="relative h-3 rounded-sm bg-wash">
            <div
              className={cx('absolute top-0 h-full rounded-sm transition-all duration-500', COLORS[r.key])}
              style={{ left: `${(r.start / max) * 100}%`, width: `max(2px, ${((r.end - r.start) / max) * 100}%)` }}
            />
          </div>
          <span className="text-right font-mono text-2xs tabular-nums text-fg-muted">{formatMs(r.end - r.start)}</span>
        </div>
      ))}
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 border-t border-rule pt-1.5 text-xs">
        <span className="font-semibold text-fg">Total</span>
        <span />
        <span className="text-right font-mono text-2xs font-semibold tabular-nums text-fg">{formatMs(summary.total)}</span>
      </div>
    </div>
  )
}

import { Lock, LockOpen, RotateCw, TriangleAlert } from 'lucide-react'
import { cx } from '../lib/cx'
import type { Journey, WorldState } from '../sim/types'

const STATUS: Partial<Record<WorldState['browser'], string>> = {
  resolving: 'Resolving host…',
  connecting: 'Connecting…',
  securing: 'Establishing secure connection…',
  waiting: 'Waiting for',
}

/**
 * A tiny browser window that shows what the user would see at this moment:
 * the status line while loading, the page, or an error page.
 */
export function BrowserPreview({ journey, world, className }: { journey: Journey; world: WorldState; className?: string }) {
  const { target } = journey
  const loading = world.browser !== 'blank' && world.browser !== 'rendered' && world.browser !== 'error' && world.browser !== 'html'
  const secure = world.tls === 'secure'
  const styled = world.resources.includes('css')
  return (
    <div className={cx('overflow-hidden rounded-md border-[1.5px] border-edge bg-card', className)} aria-label="Browser preview">
      <div className="flex items-center gap-2 border-b border-rule px-3 py-2">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-rule-strong" />
          <span className="h-2 w-2 rounded-full bg-rule-strong" />
          <span className="h-2 w-2 rounded-full bg-rule-strong" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-2xs">
          {world.tls === 'not-used' ? (
            <span className="flex items-center gap-1 text-proto-warn">
              <TriangleAlert size={11} /> Not secure
            </span>
          ) : world.tls === 'failed' ? (
            <LockOpen size={11} className="text-proto-error" />
          ) : secure ? (
            <Lock size={11} className="text-proto-tls" />
          ) : (
            <RotateCw size={11} className={cx('text-fg-faint', loading && 'animate-spin')} />
          )}
          <span className="truncate font-mono text-fg-muted">{target.host + (target.path !== '/' ? target.path : '')}</span>
        </div>
      </div>
      <div className="relative h-36 bg-paper">
        {world.browser === 'error' && world.error ? (
          <div className="flex h-full flex-col justify-center bg-paper px-4 text-fg">
            <div className="text-[13px] font-semibold">{world.error.title}</div>
            <div className="mt-1 text-[10.5px] leading-snug text-fg-muted">{world.error.detail}</div>
            <div className="mt-2 font-mono text-[9.5px] text-proto-error">{world.error.code}</div>
          </div>
        ) : world.httpStatus === 404 && world.browser === 'rendered' ? (
          <div className="p-4 font-serif text-fg">
            <div className="text-lg font-bold">404 Not Found</div>
            <div className="mt-1 text-xs">The requested page does not exist.</div>
          </div>
        ) : world.browser === 'html' || world.browser === 'rendered' ? (
          <div className={cx('h-full p-4 transition-all duration-500', styled ? 'font-sans text-fg-muted' : 'font-serif text-fg')}>
            <div className={cx('font-bold transition-all duration-500', styled ? 'font-display text-base text-fg' : 'text-lg')}>
              {/^(www\.)?example\.(com|org|net)$/.test(target.host) ? 'Example Domain' : `Welcome to ${target.host}`}
            </div>
            <p className="mt-1.5 text-[11px] leading-snug">
              {/^(www\.)?example\.(com|org|net)$/.test(target.host)
                ? 'This domain is for use in documentation examples without needing permission.'
                : 'This page was produced by the PacketWorld simulator. No real request was made.'}
            </p>
            {world.browser === 'html' && <p className="mt-3 text-[10px] text-fg-faint">Unstyled: waiting for style.css…</p>}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-[11px] text-fg-faint">{world.browser === 'blank' ? 'New tab' : ''}</span>
          </div>
        )}
        {loading && STATUS[world.browser] && (
          <div className="absolute bottom-0 left-0 max-w-full truncate rounded-tr-md border-r border-t border-rule bg-wash px-2 py-0.5 text-[10px] text-fg-muted">
            {STATUS[world.browser]}
            {world.browser === 'waiting' ? ` ${target.host}…` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

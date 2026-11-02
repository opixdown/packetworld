import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

export function Panel({ title, actions, children, className, bodyClassName }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cx('rounded-md border-[1.5px] border-edge bg-card', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
          {title && <h2 className="font-display text-base font-semibold text-fg">{title}</h2>}
          {actions}
        </header>
      )}
      <div className={cx('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}

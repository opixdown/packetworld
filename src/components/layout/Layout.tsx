import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function Layout() {
  const { pathname } = useLocation()
  // Block body on purpose: newer browsers return a Promise from scrollTo, and
  // React would treat a returned value as this effect's cleanup function.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-fg focus:px-3 focus:py-1.5 focus:text-paper">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-16 text-sm text-fg-faint">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}

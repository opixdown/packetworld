import { Github, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { REPO_URL } from '../../lib/site'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

const NAV = [
  { to: '/journey', label: 'Journey' },
  { to: '/playground', label: 'Playground' },
  { to: '/learn', label: 'Learn' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  const link = ({ isActive }: { isActive: boolean }) =>
    cx('rounded-md px-3 py-1.5 text-sm transition-colors', isActive ? 'bg-wash text-fg' : 'text-fg-muted hover:text-fg')
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <Logo />
          PacketWorld
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={link}>
              {n.label}
            </NavLink>
          ))}
          <a href={REPO_URL} className="ml-2 grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-wash hover:text-fg" aria-label="PacketWorld on GitHub">
            <Github size={17} />
          </a>
          <ThemeToggle className="ml-1" />
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button className="grid h-9 w-9 place-items-center rounded-md text-fg-muted" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-rule px-4 py-2 sm:hidden" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cx('block rounded-md px-3 py-2.5 text-sm', isActive ? 'bg-wash text-fg' : 'text-fg-muted')}>
              {n.label}
            </NavLink>
          ))}
          <a href={REPO_URL} className="block rounded-md px-3 py-2.5 text-sm text-fg-muted">
            GitHub
          </a>
        </nav>
      )}
    </header>
  )
}

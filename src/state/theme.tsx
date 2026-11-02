import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { load, save } from '../lib/storage'

// Light (the default) or dark. The choice is remembered only once the visitor
// presses the toggle, and applied as data-theme on <html>; index.html applies
// it before first paint. ADR 0022.

export type Theme = 'dark' | 'light'

const KEY = 'pw.theme.choice'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (load<Theme>(KEY, 'light') === 'dark' ? 'dark' : 'light'))
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  // Saved only when the visitor chooses, so first visits always start light.
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      save(KEY, next)
      return next
    })
  }, [])
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

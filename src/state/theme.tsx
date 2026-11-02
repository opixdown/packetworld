import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { load, save } from '../lib/storage'

// Dark (the default) or light. The choice is remembered per browser and applied
// as data-theme on <html>; index.html applies it before first paint. ADR 0022.

export type Theme = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (load<Theme>('pw.theme', 'dark') === 'light' ? 'light' : 'dark'))
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    save('pw.theme', theme)
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

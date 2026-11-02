import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { load, save } from '../lib/storage'
import type { Mode } from '../sim/types'

// Beginner vs technical explanations. One global switch, remembered per browser.

const ModeContext = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({ mode: 'beginner', setMode: () => {} })

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => load<Mode>('pw.mode', 'beginner'))
  useEffect(() => {
    save('pw.mode', mode)
  }, [mode])
  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>
}

export const useMode = () => useContext(ModeContext)

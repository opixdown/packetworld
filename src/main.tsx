import '@fontsource-variable/fraunces'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
import { installVirtualClock } from './vendor/stageshow/clock'

// Recording the intro film (#/promo/intro?record=1): replace the page's clocks
// with a virtual one so a recorder can step it exactly one frame at a time.
if (location.hash.includes('record=1')) {
  ;(window as unknown as { __clock: unknown }).__clock = installVirtualClock({ fps: 30 })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

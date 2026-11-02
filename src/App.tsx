import { Suspense, lazy } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LandingPage } from './pages/Landing'
import { NotFoundPage } from './pages/NotFound'
import { RouteError } from './pages/RouteError'
import { ModeProvider } from './state/mode'
import { ThemeProvider } from './state/theme'

// The landing page loads first; everything else is fetched when visited.
const JourneyPage = lazy(() => import('./pages/Journey').then((m) => ({ default: m.JourneyPage })))
const PlaygroundPage = lazy(() => import('./pages/Playground').then((m) => ({ default: m.PlaygroundPage })))
const LearnPage = lazy(() => import('./pages/Learn').then((m) => ({ default: m.LearnPage })))
const LessonPage = lazy(() => import('./pages/Lesson').then((m) => ({ default: m.LessonPage })))
const IntroVideo = lazy(() => import('./promo/IntroVideo').then((m) => ({ default: m.IntroVideo })))

// Hash routing works on any static host (GitHub Pages included) without
// server rewrites. See docs/decisions/0011-hash-router-for-static-hosting.md.
const router = createHashRouter([
  // The intro film, full screen without the site chrome. See docs/design/INTRO_VIDEO.md.
  {
    path: '/promo/intro',
    element: (
      <Suspense fallback={null}>
        <IntroVideo />
      </Suspense>
    ),
  },
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/journey', element: <JourneyPage /> },
      { path: '/playground', element: <PlaygroundPage /> },
      { path: '/learn', element: <LearnPage /> },
      { path: '/learn/:slug', element: <LessonPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function App() {
  return (
    <ThemeProvider>
      <ModeProvider>
        <RouterProvider router={router} />
      </ModeProvider>
    </ThemeProvider>
  )
}

import type { BeforeSendEvent } from '@vercel/analytics/react'

/**
 * The site uses hash URLs (/#/journey), which analytics would count as "/".
 * Turn the hash route into a normal path so each page shows up on its own,
 * and skip the hidden intro-film page. Query strings (playground settings)
 * are dropped: only the page is counted. See docs/decisions/0023-privacy-friendly-analytics.md.
 */
export function analyticsBeforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url)
  const route = url.hash.startsWith('#/') ? url.hash.slice(1).split('?')[0] : '/'
  if (route.startsWith('/promo')) return null
  return { ...event, url: `${url.origin}${route}` }
}

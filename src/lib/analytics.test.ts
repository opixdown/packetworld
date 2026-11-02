import { describe, expect, it } from 'vitest'
import { analyticsBeforeSend } from './analytics'

const view = (url: string) => analyticsBeforeSend({ type: 'pageview', url })?.url ?? null

describe('analytics URLs', () => {
  it('turns hash routes into paths', () => {
    expect(view('https://packetworld.vercel.app/#/journey')).toBe('https://packetworld.vercel.app/journey')
    expect(view('https://packetworld.vercel.app/#/learn/dns')).toBe('https://packetworld.vercel.app/learn/dns')
  })

  it('counts the landing page as /', () => {
    expect(view('https://packetworld.vercel.app/')).toBe('https://packetworld.vercel.app/')
    expect(view('https://packetworld.vercel.app/#/')).toBe('https://packetworld.vercel.app/')
  })

  it('drops query strings and skips the hidden intro film', () => {
    expect(view('https://packetworld.vercel.app/#/playground?exp=loss&loss=15')).toBe('https://packetworld.vercel.app/playground')
    expect(view('https://packetworld.vercel.app/#/promo/intro?record=1')).toBeNull()
  })
})

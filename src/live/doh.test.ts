import { describe, expect, it } from 'vitest'
import { parseDoh } from './doh'

describe('DoH JSON parsing', () => {
  it('reads answers, follows type codes and strips trailing dots', () => {
    const r = parseDoh(
      {
        Status: 0,
        AD: true,
        Answer: [
          { name: 'www.example.org.', type: 5, TTL: 300, data: 'example.org.' },
          { name: 'example.org.', type: 1, TTL: 120, data: '93.184.215.14' },
        ],
      },
      'Cloudflare (1.1.1.1)',
      'www.example.org',
      23.6,
    )
    expect(r).toMatchObject({ status: 'NOERROR', dnssec: true, ms: 24 })
    expect(r.answers.map((a) => `${a.type} ${a.name} ${a.data}`)).toEqual(['CNAME www.example.org example.org', 'A example.org 93.184.215.14'])
  })

  it('reports NXDOMAIN with no answers', () => {
    const r = parseDoh({ Status: 3 }, 'Google (8.8.8.8)', 'nope.invalid', 10)
    expect(r.status).toBe('NXDOMAIN')
    expect(r.answers).toEqual([])
  })
})

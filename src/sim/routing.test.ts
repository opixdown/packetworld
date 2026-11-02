import { describe, expect, it } from 'vitest'
import { forwardPath, linkKey, routingTable } from './routing'

describe('routing model', () => {
  it('takes the cheapest path when every link is up', () => {
    expect(forwardPath(new Set())).toEqual(['A', 'B', 'D', 'E', 'F'])
    expect(routingTable(new Set()).A).toEqual({ next: 'B', cost: 5 })
  })

  it('routes around a failed link', () => {
    expect(forwardPath(new Set([linkKey('D', 'E')]))).toEqual(['A', 'B', 'D', 'F'])
  })

  it('reports no route when the destination is cut off', () => {
    const down = new Set([linkKey('D', 'F'), linkKey('E', 'F'), linkKey('B', 'F')])
    expect(forwardPath(down)).toBeNull()
    expect(routingTable(down).A.next).toBeNull()
  })
})

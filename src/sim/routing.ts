// A tiny link-state routing model for the "Routers and packet routing" lesson.
// Each router computes, with Dijkstra's algorithm, the next hop towards the
// destination network: the same idea OSPF uses inside one network.

export type RouterId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export const DEST_NETWORK = '203.0.113.0/24'
/** The router the destination network is attached to. */
export const DEST_ROUTER: RouterId = 'F'
export const SOURCE_ROUTER: RouterId = 'A'

export const ROUTERS: { id: RouterId; x: number; y: number }[] = [
  { id: 'A', x: 90, y: 160 },
  { id: 'B', x: 230, y: 70 },
  { id: 'C', x: 230, y: 250 },
  { id: 'D', x: 370, y: 160 },
  { id: 'E', x: 500, y: 250 },
  { id: 'F', x: 560, y: 90 },
]

export const ROUTER_LINKS: { a: RouterId; b: RouterId; cost: number }[] = [
  { a: 'A', b: 'B', cost: 1 },
  { a: 'A', b: 'C', cost: 3 },
  { a: 'B', b: 'D', cost: 2 },
  { a: 'C', b: 'D', cost: 1 },
  { a: 'C', b: 'E', cost: 4 },
  { a: 'D', b: 'E', cost: 1 },
  { a: 'D', b: 'F', cost: 3 },
  { a: 'E', b: 'F', cost: 1 },
  { a: 'B', b: 'F', cost: 6 },
]

export const linkKey = (a: RouterId, b: RouterId) => [a, b].sort().join('-')

export interface Route {
  next: RouterId | null
  cost: number
}

/**
 * For every router, the next hop and total cost to reach `target`, using only
 * links that are up. Runs Dijkstra from the target outwards (links are
 * symmetric), so each router's next hop is its neighbour on the shortest path.
 */
export function routingTable(down: ReadonlySet<string>, target: RouterId = DEST_ROUTER): Record<RouterId, Route> {
  const ids = ROUTERS.map((r) => r.id)
  const dist = Object.fromEntries(ids.map((id) => [id, Infinity])) as Record<RouterId, number>
  const next = Object.fromEntries(ids.map((id) => [id, null])) as Record<RouterId, RouterId | null>
  const done = new Set<RouterId>()
  dist[target] = 0
  while (done.size < ids.length) {
    const u = ids.filter((id) => !done.has(id)).sort((x, y) => dist[x] - dist[y] || x.localeCompare(y))[0]
    if (dist[u] === Infinity) break
    done.add(u)
    for (const l of ROUTER_LINKS) {
      if (down.has(linkKey(l.a, l.b))) continue
      const v = l.a === u ? l.b : l.b === u ? l.a : null
      if (!v || done.has(v)) continue
      const d = dist[u] + l.cost
      if (d < dist[v]) {
        dist[v] = d
        // v reaches the target by going to u first.
        next[v] = u
      }
    }
  }
  return Object.fromEntries(ids.map((id) => [id, { next: next[id], cost: dist[id] }])) as Record<RouterId, Route>
}

/** The hop-by-hop path a packet takes from `from`, or null if there is no route. */
export function forwardPath(down: ReadonlySet<string>, from: RouterId = SOURCE_ROUTER): RouterId[] | null {
  const table = routingTable(down)
  const path: RouterId[] = [from]
  let at = from
  while (at !== DEST_ROUTER) {
    const hop = table[at].next
    if (!hop || path.length > ROUTERS.length) return null
    path.push(hop)
    at = hop
  }
  return path
}

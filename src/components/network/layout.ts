import type { NodeId } from '../../sim/types'

// Where each machine sits on the canvas. Two hand-tuned layouts: a wide one
// for desktop and a tall one for phones, so labels stay readable at any width.

export interface Point {
  x: number
  y: number
}

export interface CanvasLayout {
  width: number
  height: number
  node: { w: number; h: number }
  pos: Record<NodeId, Point>
  /** Where the "across the internet" caption sits. */
  internetLabel: Point & { anchor: 'start' | 'middle' | 'end' }
}

export const WIDE: CanvasLayout = {
  width: 960,
  height: 520,
  node: { w: 178, h: 62 },
  pos: {
    client: { x: 112, y: 330 },
    router: { x: 330, y: 330 },
    resolver: { x: 545, y: 150 },
    root: { x: 840, y: 55 },
    tld: { x: 840, y: 165 },
    auth: { x: 840, y: 275 },
    server: { x: 840, y: 445 },
  },
  internetLabel: { x: 575, y: 428, anchor: 'middle' },
}

// The tall layout starts lower, leaving room for the "simulation" badge.
export const TALL: CanvasLayout = {
  width: 420,
  height: 668,
  node: { w: 128, h: 54 },
  pos: {
    root: { x: 70, y: 78 },
    tld: { x: 210, y: 78 },
    auth: { x: 350, y: 78 },
    resolver: { x: 210, y: 218 },
    router: { x: 95, y: 378 },
    server: { x: 320, y: 498 },
    client: { x: 95, y: 613 },
  },
  internetLabel: { x: 300, y: 410, anchor: 'middle' },
}

export const LINKS: { a: NodeId; b: NodeId; kind: 'lan' | 'internet' }[] = [
  { a: 'client', b: 'router', kind: 'lan' },
  { a: 'router', b: 'resolver', kind: 'internet' },
  { a: 'router', b: 'server', kind: 'internet' },
  { a: 'resolver', b: 'root', kind: 'internet' },
  { a: 'resolver', b: 'tld', kind: 'internet' },
  { a: 'resolver', b: 'auth', kind: 'internet' },
]

export const linkId = (a: NodeId, b: NodeId) => [a, b].sort().join('~')

/** The nodes a packet visibly passes through. Anything to or from the client crosses the home router. */
export function route(from: NodeId, to: NodeId): NodeId[] {
  if (from === 'client') return ['client', 'router', to]
  if (to === 'client') return [from, 'router', 'client']
  return [from, to]
}

/** Point at fraction t (0–1) along a polyline. */
export function along(points: Point[], t: number): Point {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y))
  const total = lengths.reduce((a, b) => a + b, 0)
  let d = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] === 0 ? 0 : Math.min(1, d / lengths[i])
      return { x: points[i].x + (points[i + 1].x - points[i].x) * f, y: points[i].y + (points[i + 1].y - points[i].y) * f }
    }
    d -= lengths[i]
  }
  return points[points.length - 1]
}

/** Smooth travel: ease in and out, matching the design system's travel curve. */
export function easeTravel(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

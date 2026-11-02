import type { Point } from './layout'

export interface ConnectionLineProps {
  a: Point
  b: Point
  kind: 'lan' | 'internet'
  /** Protocol ink when a packet is travelling on this link. */
  activeColor?: string
}

/**
 * A link between two machines. Solid for your home network; dashed for paths
 * across the internet, which really pass through many routers we don't draw.
 */
export function ConnectionLine({ a, b, kind, activeColor }: ConnectionLineProps) {
  const dash = kind === 'internet' ? '1 7' : undefined
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgb(var(--pw-rule-strong))" strokeWidth={2} strokeDasharray={dash} strokeLinecap="round" />
      {activeColor && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={activeColor} strokeWidth={3} strokeLinecap="round" strokeDasharray={dash} />}
    </g>
  )
}

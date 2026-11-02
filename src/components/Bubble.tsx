import { X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  /** The element the bubble points at. */
  anchor: HTMLElement | SVGElement | DOMRect | null
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** Accent ink for the top edge. */
  accent?: string
  width?: number
}

/**
 * A small explainer card that opens right next to whatever was tapped.
 * Stays inside the viewport, closes on Escape, outside click or the ×.
 */
export function Bubble({ anchor, onClose, title, children, accent = 'rgb(var(--pw-edge))', width = 300 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null)

  useLayoutEffect(() => {
    if (!anchor) return
    const place = () => {
      const r = anchor instanceof DOMRect ? anchor : anchor.getBoundingClientRect()
      const h = ref.current?.offsetHeight ?? 160
      const w = Math.min(width, window.innerWidth - 24)
      const left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2))
      const below = r.bottom + 10
      const above = below + h > window.innerHeight - 12 && r.top - h - 10 > 12
      setPos({ left, top: above ? r.top - h - 10 : below, above })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor, width])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    // Defer so the click that opened the bubble doesn't close it.
    const id = setTimeout(() => window.addEventListener('pointerdown', onDown), 0)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [onClose])

  if (!anchor) return null
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={typeof title === 'string' ? title : 'Explanation'}
      className="fixed z-50 animate-fade-up rounded-md border-[1.5px] border-edge bg-card p-3.5 text-sm text-fg shadow-note"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: Math.min(width, window.innerWidth - 24), borderTop: `4px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-3">
        {title && <div className="font-display text-base font-semibold leading-snug">{title}</div>}
        <button onClick={onClose} className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded text-fg-faint hover:bg-wash hover:text-fg" aria-label="Close">
          <X size={15} />
        </button>
      </div>
      <div className="mt-1.5 leading-relaxed text-fg-muted">{children}</div>
    </div>,
    document.body,
  )
}

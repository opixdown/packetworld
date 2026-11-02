import type { ReactNode } from 'react'

/** Renders the tiny markup used in lesson content: **bold** and `code`. */
export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push(text.slice(last, m.index))
    const t = m[0]
    parts.push(t.startsWith('**') ? <strong key={m.index}>{t.slice(2, -2)}</strong> : <code key={m.index}>{t.slice(1, -1)}</code>)
    last = m.index! + t.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

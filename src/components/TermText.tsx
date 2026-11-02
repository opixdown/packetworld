import { useState, type ReactNode } from 'react'
import { TERM_PATTERN, lookupTerm, type Term } from '../content/glossary'
import { Bubble } from './Bubble'

/** Common words: linked only if nothing more interesting is in the sentence. */
const LOW = new Set(['Server', 'Browser', 'Request', 'Response', 'Connection', 'Key', 'IP address', 'Packet'])
const MAX_LINKS = 3

/**
 * Renders a sentence with its key terms underlined. Tapping one opens a small
 * bubble with a one-line meaning. Only the first few interesting terms are
 * linked, so the text stays easy to read.
 */
export function TermText({ text }: { text: string }) {
  const [open, setOpen] = useState<{ term: Term; el: HTMLElement } | null>(null)

  const found: { index: number; length: number; term: Term }[] = []
  for (const m of text.matchAll(TERM_PATTERN)) {
    const term = lookupTerm(m[0])
    if (term && !found.some((f) => f.term === term)) found.push({ index: m.index!, length: m[0].length, term })
  }
  const chosen = [...found.filter((f) => !LOW.has(f.term.term)), ...found.filter((f) => LOW.has(f.term.term))]
    .slice(0, MAX_LINKS)
    .sort((a, b) => a.index - b.index)

  const parts: ReactNode[] = []
  let last = 0
  for (const f of chosen) {
    parts.push(text.slice(last, f.index))
    const word = text.slice(f.index, f.index + f.length)
    parts.push(
      // A span, not a <button>: buttons can't wrap with the text around them.
      <span
        key={f.index}
        role="button"
        tabIndex={0}
        onClick={(e) => setOpen({ term: f.term, el: e.currentTarget })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen({ term: f.term, el: e.currentTarget })
          }
        }}
        className="cursor-help rounded-sm underline decoration-fg-faint decoration-dotted decoration-2 underline-offset-[3px] hover:bg-tint-marker hover:decoration-fg"
      >
        {word}
      </span>,
    )
    last = f.index + f.length
  }
  parts.push(text.slice(last))

  return (
    <>
      {parts}
      {open && (
        <Bubble anchor={open.el} onClose={() => setOpen(null)} title={open.term.term} width={280}>
          <p>{open.term.short}</p>
          {open.term.example && <p className="mt-1.5 font-mono text-xs text-fg-faint">e.g. {open.term.example}</p>}
        </Bubble>
      )}
    </>
  )
}

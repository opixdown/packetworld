import { ArrowDown } from 'lucide-react'
import { NODE_CONTENT } from '../content/nodes'
import { PROTOCOL_COLOR, PROTOCOL_NAME } from '../lib/protocols'
import { addressing } from '../sim/topology'
import type { Journey, NodeId, SimEvent } from '../sim/types'
import { Bubble } from './Bubble'
import type { Selection } from './network/NetworkCanvas'
import { TermText } from './TermText'

interface Props {
  journey: Journey
  selection: Selection
  anchor: Element
  current?: SimEvent
  onClose: () => void
  /** Scroll to the full inspector. */
  onMore: () => void
}

/** The small explainer that opens right on the map when a machine or packet is tapped. */
export function MapExplainer({ journey, selection, anchor, current, onClose, onMore }: Props) {
  const addr = addressing(journey.target)
  const more = (label: string) => (
    <button onClick={onMore} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-fg underline decoration-2 underline-offset-4 hover:decoration-proto-tcp">
      {label} <ArrowDown size={14} />
    </button>
  )

  if (selection.kind === 'node') {
    const id = selection.id as NodeId
    const content = NODE_CONTENT[id]
    const busy = current && (current.actor === id || current.packet?.to === id)
    return (
      <Bubble anchor={anchor as HTMLElement} onClose={onClose} title={addr[id].name}>
        <p className="font-mono text-xs text-fg-faint">{content.role}</p>
        <p className="mt-1.5 text-fg">
          <TermText text={firstSentences(content.beginner, 2)} />
        </p>
        {busy && current && (
          <p className="mt-2 text-sm">
            <span className="font-semibold text-fg">Right now: </span>
            {current.title}
          </p>
        )}
        {more('Full details')}
      </Bubble>
    )
  }

  const event = journey.events[selection.id as number]
  const packet = event?.packet
  if (!packet) return null
  return (
    <Bubble
      anchor={anchor as HTMLElement}
      onClose={onClose}
      accent={PROTOCOL_COLOR[packet.protocol]}
      title={
        <span>
          {packet.label} <span className="font-mono text-xs font-normal text-fg-faint">· {PROTOCOL_NAME[packet.protocol]} packet</span>
        </span>
      }
    >
      <p className="text-fg">
        <TermText text={packet.beginner.what} />
      </p>
      <p className="mt-2 font-mono text-xs text-fg-faint">
        {addr[packet.from].name} → {addr[packet.to].name}
        {packet.encrypted ? ' · encrypted' : ''}
      </p>
      {more('Look inside this packet')}
    </Bubble>
  )
}

/** The first n sentences of a paragraph. */
function firstSentences(text: string, n: number): string {
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)/g)
  return parts ? parts.slice(0, n).join('').trim() : text
}

import { useEffect, useRef, useState } from 'react'
import { usePlayback } from '../hooks/usePlayback'
import type { Journey, NodeId } from '../sim/types'
import { MapExplainer } from './MapExplainer'
import type { Selection } from './network/NetworkCanvas'
import { PacketInspector } from './PacketInspector'
import { SequenceDiagram } from './SequenceDiagram'
import { SimulationControls } from './SimulationControls'
import { StepCard } from './StepCard'

/** A sequence diagram with playback, the step card and the packet inspector. Used by the handshake lessons. */
export function SequencePlayer({ journey, columns, showTcpState, autoplay }: { journey: Journey; columns: NodeId[]; showTcpState?: boolean; autoplay?: boolean }) {
  const playback = usePlayback(journey.events, journey.initial, { autoplay })
  const [selection, setSelection] = useState<Selection | null>(null)
  const [bubble, setBubble] = useState<{ selection: Selection; el: Element } | null>(null)
  const inspectorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setSelection(null)
    setBubble(null)
  }, [journey])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="flex min-w-0 flex-col gap-3 self-start">
          <SequenceDiagram
            journey={journey}
            playback={playback}
            columns={columns}
            showTcpState={showTcpState}
            selectedIndex={selection?.kind === 'packet' ? (selection.id as number) : null}
            onSelect={(i, el) => {
              const s: Selection = { kind: 'packet', id: i }
              setSelection(s)
              setBubble({ selection: s, el })
            }}
          />
          <div className="rounded-md border-[1.5px] border-edge bg-card px-3 py-2">
            <SimulationControls playback={playback} total={journey.events.length} />
          </div>
        </div>
        <StepCard journey={journey} playback={playback} className="self-start" />
      </div>
      <div ref={inspectorRef} className="scroll-mt-20">
        <PacketInspector journey={journey} selection={selection} current={playback.event} world={playback.world} onUnpin={() => setSelection(null)} className="max-h-[560px]" />
      </div>
      {bubble && (
        <MapExplainer
          journey={journey}
          selection={bubble.selection}
          anchor={bubble.el}
          current={playback.event}
          onClose={() => setBubble(null)}
          onMore={() => {
            setBubble(null)
            inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      )}
    </div>
  )
}

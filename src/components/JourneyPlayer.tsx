import { MousePointerClick, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePlayback, type Playback } from '../hooks/usePlayback'
import { cx } from '../lib/cx'
import { load, save } from '../lib/storage'
import type { Journey, NodeId } from '../sim/types'
import { BrowserPreview } from './BrowserPreview'
import { MapExplainer } from './MapExplainer'
import { NetworkCanvas, type Selection } from './network/NetworkCanvas'
import { PacketInspector } from './PacketInspector'
import { ProtocolTimeline, StepList } from './ProtocolTimeline'
import { SimulationControls } from './SimulationControls'
import { StepCard } from './StepCard'

interface Props {
  journey: Journey
  autoplay?: boolean
  /** Enable Space / ← / → shortcuts. Only one player per page should. */
  keyboard?: boolean
  /** Lesson mode: no stage strip or step list. */
  compact?: boolean
  nodes?: NodeId[]
  /** Rendered under the inspector row, e.g. a timing summary. */
  footer?: (playback: Playback) => ReactNode
}

export function JourneyPlayer({ journey, autoplay, keyboard, compact, nodes, footer }: Props) {
  const playback = usePlayback(journey.events, journey.initial, { autoplay })
  const [selection, setSelection] = useState<Selection | null>(null)
  const [bubble, setBubble] = useState<{ selection: Selection; el: Element } | null>(null)
  const [hint, setHint] = useState(() => !load('pw.hint.map', false))
  const inspectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelection(null)
    setBubble(null)
  }, [journey])

  const dismissHint = () => {
    setHint(false)
    save('pw.hint.map', true)
  }

  const handleSelect = (s: Selection, el: Element) => {
    setSelection(s)
    setBubble({ selection: s, el })
    if (hint) dismissHint()
    if (playback.playing && !playback.guided) playback.pause()
  }

  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ' && !el.closest('button, [role="button"]')) {
        e.preventDefault()
        playback.toggle()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        playback.next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        playback.prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyboard, playback])

  return (
    <div className="flex flex-col gap-4">
      {!compact && <ProtocolTimeline journey={journey} index={playback.index} progress={playback.progress} onSeek={playback.seek} />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="min-w-0 self-start overflow-hidden rounded-md border-[1.5px] border-edge bg-card/60">
          <div className="relative">
            <NetworkCanvas journey={journey} playback={playback} selection={selection} onSelect={handleSelect} nodes={nodes} />
            <span className="pointer-events-none absolute left-3 top-3 font-display text-xs italic text-fg-faint">Simulation · no real network traffic</span>
            {hint && (
              <div className="m-3 flex items-center gap-2 rounded-md border-[1.5px] border-edge bg-tint-marker px-3 py-2 text-sm font-semibold text-fg shadow-note-sm sm:absolute sm:bottom-3 sm:left-3 sm:m-0 sm:max-w-xs">
                <MousePointerClick size={17} className="shrink-0" />
                <span className="flex-1">Tap any machine or packet to learn what it is.</span>
                <button onClick={dismissHint} aria-label="Dismiss tip" className="grid h-7 w-7 place-items-center rounded hover:bg-card/60">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
          <div className="border-t-[1.5px] border-edge bg-card px-3 py-2">
            <SimulationControls playback={playback} total={journey.events.length} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <StepCard journey={journey} playback={playback} />
          <BrowserPreview journey={journey} world={playback.world} />
        </div>
      </div>

      <div ref={inspectorRef} className={cx('grid scroll-mt-20 gap-4', !compact && 'lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]')}>
        <PacketInspector
          journey={journey}
          selection={selection}
          current={playback.event}
          world={playback.world}
          onUnpin={() => setSelection(null)}
          className="max-h-[560px]"
        />
        {!compact && (
          <details className="group self-start rounded-md border-[1.5px] border-edge bg-card">
            <summary className="cursor-pointer list-none px-4 py-3 font-display text-base font-semibold">
              All {journey.events.length} steps
              <span className="float-right font-sans text-sm font-normal text-fg-faint group-open:hidden">show list</span>
            </summary>
            <StepList journey={journey} index={playback.index} onSeek={playback.seek} className="max-h-80 overflow-y-auto border-t border-rule p-2" />
          </details>
        )}
      </div>
      {footer?.(playback)}

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

import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cx } from '../../lib/cx'

// Lesson 4: the same five messages sent over UDP and TCP, with one lost.
// Hand-written steps keep the story exact: TCP's receiver buffers out-of-order
// data and repeats its ACK until the gap is filled.

interface Step {
  dir: 'right' | 'left' | 'note'
  text: string
  tone?: 'lost' | 'retransmit' | 'app' | 'ack'
}

function udpSteps(lose: boolean): Step[] {
  const s: Step[] = []
  for (let i = 1; i <= 5; i++) s.push(lose && i === 3 ? { dir: 'right', text: `message ${i}`, tone: 'lost' } : { dir: 'right', text: `message ${i}` })
  s.push({ dir: 'note', text: lose ? 'App receives 1, 2, 4, 5. Message 3 is simply gone; nobody resends it.' : 'App receives 1, 2, 3, 4, 5.', tone: 'app' })
  return s
}

function tcpSteps(lose: boolean): Step[] {
  if (!lose) {
    return [
      { dir: 'right', text: 'bytes 1–100 (msg 1)' },
      { dir: 'right', text: 'bytes 101–200 (msg 2)' },
      { dir: 'left', text: 'ACK 201', tone: 'ack' },
      { dir: 'right', text: 'bytes 201–300 (msg 3)' },
      { dir: 'right', text: 'bytes 301–400 (msg 4)' },
      { dir: 'left', text: 'ACK 401', tone: 'ack' },
      { dir: 'right', text: 'bytes 401–500 (msg 5)' },
      { dir: 'left', text: 'ACK 501', tone: 'ack' },
      { dir: 'note', text: 'App receives 1, 2, 3, 4, 5, in order.', tone: 'app' },
    ]
  }
  return [
    { dir: 'right', text: 'bytes 1–100 (msg 1)' },
    { dir: 'right', text: 'bytes 101–200 (msg 2)' },
    { dir: 'left', text: 'ACK 201', tone: 'ack' },
    { dir: 'right', text: 'bytes 201–300 (msg 3)', tone: 'lost' },
    { dir: 'right', text: 'bytes 301–400 (msg 4)' },
    { dir: 'left', text: 'ACK 201 (still missing 201+, msg 4 buffered)', tone: 'ack' },
    { dir: 'right', text: 'bytes 401–500 (msg 5)' },
    { dir: 'left', text: 'ACK 201 again (duplicate ACK)', tone: 'ack' },
    { dir: 'note', text: 'Sender’s timer for bytes 201–300 expires.' },
    { dir: 'right', text: 'bytes 201–300 (msg 3, retransmitted)', tone: 'retransmit' },
    { dir: 'left', text: 'ACK 501 (everything received)', tone: 'ack' },
    { dir: 'note', text: 'App receives 1, 2, then 3, 4, 5 together, in order. Nothing missing, but 3–5 arrive late.', tone: 'app' },
  ]
}

export function TcpVsUdpLab() {
  const [lose, setLose] = useState(true)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const udp = udpSteps(lose)
  const tcp = tcpSteps(lose)
  const total = Math.max(udp.length, tcp.length)

  useEffect(() => {
    if (!playing) return
    if (step >= total) {
      setPlaying(false)
      return
    }
    const id = setTimeout(() => setStep((s) => s + 1), 750)
    return () => clearTimeout(id)
  }, [playing, step, total])

  const reset = (l = lose) => {
    setLose(l)
    setStep(0)
    setPlaying(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => (step >= total ? (setStep(0), setPlaying(true)) : setPlaying(!playing))} className="pw-btn-primary px-3 py-1.5">
          {playing ? <Pause size={14} /> : <Play size={14} />} {step === 0 ? 'Send 5 messages' : playing ? 'Pause' : step >= total ? 'Send again' : 'Continue'}
        </button>
        <button onClick={() => reset()} className="pw-btn-secondary px-3 py-1.5" aria-label="Reset">
          <RotateCcw size={14} />
        </button>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          <input type="checkbox" checked={lose} onChange={(e) => reset(e.target.checked)} className="accent-proto-error" />
          Lose message 3 on the way
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Lane title="UDP" color="text-proto-udp" subtitle="Fire and forget" steps={udp} shown={step} />
        <Lane title="TCP" color="text-proto-tcp" subtitle="Reliable, in order" steps={tcp} shown={step} />
      </div>
    </div>
  )
}

function Lane({ title, subtitle, color, steps, shown }: { title: string; subtitle: string; color: string; steps: Step[]; shown: number }) {
  return (
    <div className="rounded-md border-[1.5px] border-edge bg-card p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className={cx('font-mono font-semibold', color)}>{title}</span>
        <span className="text-xs text-fg-faint">{subtitle}</span>
      </div>
      <div className="mb-1 grid grid-cols-[1fr_1fr] text-2xs uppercase tracking-wider text-fg-faint">
        <span>Sender</span>
        <span className="text-right">Receiver</span>
      </div>
      <ol className="space-y-1">
        {steps.slice(0, shown).map((s, i) => (
          <li
            key={i}
            className={cx(
              'animate-fade-up rounded-md px-2 py-1 font-mono text-2xs',
              s.dir === 'right' && 'mr-8',
              s.dir === 'left' && 'ml-8 text-right',
              s.dir === 'note' && 'font-sans text-xs',
              s.tone === 'lost' && 'bg-proto-error/10 text-proto-error line-through decoration-proto-error/60',
              s.tone === 'retransmit' && 'bg-proto-warn/10 text-proto-warn',
              s.tone === 'ack' && 'bg-wash text-fg-muted',
              s.tone === 'app' && 'bg-proto-http/10 text-proto-http',
              !s.tone && s.dir !== 'note' && 'bg-wash text-fg',
              !s.tone && s.dir === 'note' && 'text-fg-muted',
            )}
          >
            {s.dir === 'right' ? `${s.text} →` : s.dir === 'left' ? `← ${s.text}` : s.text}
            {s.tone === 'lost' && <span className="ml-2 no-underline">✕ lost</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}

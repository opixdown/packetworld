import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AddressLab } from '../components/labs/AddressLab'
import { HttpAnatomy } from '../components/labs/HttpAnatomy'
import { DnsLab, HandshakeLab, HttpLab, OverviewLab, TlsLab } from '../components/labs/JourneyLabs'
import { LatencyLab } from '../components/labs/LatencyLab'
import { NatLab } from '../components/labs/NatLab'
import { RoutingLab } from '../components/labs/RoutingLab'
import { TcpVsUdpLab } from '../components/labs/TcpVsUdpLab'
import { ModeToggle } from '../components/ModeToggle'
import { Inline } from '../components/Prose'
import { Quiz } from '../components/Quiz'
import { LESSONS, type LabKey } from '../content/lessons'
import { cx } from '../lib/cx'
import { useProgress } from '../lib/progress'
import { useMode } from '../state/mode'
import { NotFoundPage } from './NotFound'

function HttpLessonLab() {
  return (
    <div className="space-y-6">
      <HttpAnatomy />
      <HttpLab />
    </div>
  )
}

const LABS: Record<LabKey, ComponentType> = {
  overview: OverviewLab,
  address: AddressLab,
  dns: DnsLab,
  'tcp-udp': TcpVsUdpLab,
  handshake: HandshakeLab,
  tls: TlsLab,
  http: HttpLessonLab,
  routing: RoutingLab,
  nat: NatLab,
  latency: LatencyLab,
}

export function LessonPage() {
  const { slug } = useParams()
  const { mode, setMode } = useMode()
  const { record } = useProgress()
  const index = LESSONS.findIndex((l) => l.slug === slug)
  if (index < 0) return <NotFoundPage />
  const lesson = LESSONS[index]
  const Lab = LABS[lesson.lab]
  const prev = LESSONS[index - 1]
  const next = LESSONS[index + 1]

  return (
    <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/learn" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> All lessons
      </Link>
      <header className="mt-4 max-w-3xl">
        <p className="font-mono text-xs text-fg-faint">
          Lesson {index + 1} of {LESSONS.length} · {lesson.minutes} min
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-fg-muted">{lesson.intro}</p>
      </header>

      <section className="mt-8" aria-labelledby="lab">
        <h2 id="lab" className="font-display text-base font-semibold text-fg">
          Try it
        </h2>
        <p className="mb-4 mt-1 text-sm text-fg-muted">{lesson.labHint}</p>
        <Lab />
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="explain">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="explain" className="text-xl font-semibold">
            Explanation
          </h2>
          <ModeToggle />
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <ExplanationColumn title="In plain words" active={mode === 'beginner'} onActivate={() => setMode('beginner')} paragraphs={lesson.simple} />
          <ExplanationColumn title="Technically" active={mode === 'technical'} onActivate={() => setMode('technical')} paragraphs={lesson.technical} />
        </div>
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="quiz">
        <h2 id="quiz" className="text-xl font-semibold">
          Check yourself
        </h2>
        <div className="mt-4">
          <Quiz key={lesson.slug} questions={lesson.quiz} onComplete={(score) => record(lesson.slug, score)} />
        </div>
      </section>

      <nav className="mt-12 flex justify-between gap-4 border-t border-rule pt-6 text-sm">
        {prev ? (
          <Link to={`/learn/${prev.slug}`} className="group text-fg-muted hover:text-fg">
            <span className="flex items-center gap-1 text-xs text-fg-faint">
              <ArrowLeft size={12} /> Previous
            </span>
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/learn/${next.slug}`} className="text-right text-fg-muted hover:text-fg">
            <span className="flex items-center justify-end gap-1 text-xs text-fg-faint">
              Next <ArrowRight size={12} />
            </span>
            {next.title}
          </Link>
        )}
      </nav>
    </article>
  )
}

function ExplanationColumn({ title, paragraphs, active, onActivate }: { title: string; paragraphs: string[]; active: boolean; onActivate: () => void }) {
  return (
    <div className={cx('rounded-md border p-4 transition-opacity', active ? 'border-rule-strong bg-card' : 'cursor-pointer border-rule opacity-60 hover:opacity-90')} onClick={active ? undefined : onActivate}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="pw-prose text-sm">
        {paragraphs.map((p, i) => (
          <p key={i}>
            <Inline text={p} />
          </p>
        ))}
      </div>
    </div>
  )
}

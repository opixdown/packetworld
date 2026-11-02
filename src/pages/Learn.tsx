import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LESSONS } from '../content/lessons'
import { useProgress } from '../lib/progress'

export function LearnPage() {
  const { scores } = useProgress()
  const done = LESSONS.filter((l) => scores[l.slug] !== undefined).length
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Learn networking, one layer at a time</h1>
      <p className="mt-2 max-w-2xl text-fg-muted">
        Ten short lessons. Each has an interactive lab, a plain-language explanation, the technical details, and a three-question quiz.
      </p>
      <p className="mt-3 text-xs text-fg-faint">
        {done} of {LESSONS.length} quizzes completed · progress is saved in this browser only
      </p>
      <ol className="mt-8 divide-y divide-rule border-y border-rule">
        {LESSONS.map((l, i) => (
          <li key={l.slug}>
            <Link to={`/learn/${l.slug}`} className="group flex items-start gap-4 py-4">
              <span className="w-6 pt-0.5 text-right font-mono text-sm text-fg-faint">{i + 1}</span>
              <span className="flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  {l.title}
                  {scores[l.slug] !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-proto-http">
                      <CheckCircle2 size={13} /> {scores[l.slug]}/{l.quiz.length}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-fg-muted">{l.summary}</span>
              </span>
              <span className="hidden pt-0.5 text-xs text-fg-faint sm:block">{l.minutes} min</span>
              <ArrowRight size={16} className="mt-1 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

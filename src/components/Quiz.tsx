import { Check, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../lib/cx'

export interface QuizQuestion {
  question: string
  options: string[]
  /** Index into options. */
  answer: number
  explanation: string
}

/** A short multiple-choice quiz. Explains every answer, right or wrong. */
export function Quiz({ questions, onComplete }: { questions: QuizQuestion[]; onComplete?: (score: number) => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const done = answers.every((a) => a !== null)
  const score = answers.filter((a, i) => a === questions[i].answer).length

  const choose = (q: number, option: number) => {
    if (answers[q] !== null) return
    const next = answers.map((a, i) => (i === q ? option : a))
    setAnswers(next)
    if (next.every((a) => a !== null)) onComplete?.(next.filter((a, i) => a === questions[i].answer).length)
  }

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => {
        const picked = answers[qi]
        return (
          <fieldset key={qi} className="rounded-md border-[1.5px] border-edge bg-card p-4">
            <legend className="sr-only">Question {qi + 1}</legend>
            <p className="font-display text-lg font-semibold">
              <span className="mr-2 font-mono text-xs text-fg-faint">{qi + 1}.</span>
              {q.question}
            </p>
            <div className="mt-3 grid gap-2">
              {q.options.map((o, oi) => {
                const isAnswer = oi === q.answer
                const isPicked = oi === picked
                return (
                  <button
                    key={oi}
                    onClick={() => choose(qi, oi)}
                    disabled={picked !== null}
                    aria-pressed={isPicked}
                    className={cx(
                      'flex items-start gap-2.5 rounded-md border-[1.5px] px-3 py-2.5 text-left transition-colors',
                      picked === null && 'border-edge/40 bg-card hover:border-edge hover:bg-tint-marker',
                      picked !== null && isAnswer && 'border-proto-http/50 bg-proto-http/10 text-fg',
                      picked !== null && isPicked && !isAnswer && 'border-proto-error/50 bg-proto-error/10 text-fg',
                      picked !== null && !isAnswer && !isPicked && 'border-rule text-fg-faint',
                    )}
                  >
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
                      {picked !== null && isAnswer && <Check size={14} className="text-proto-http" />}
                      {picked !== null && isPicked && !isAnswer && <X size={14} className="text-proto-error" />}
                      {picked === null && <span className="h-3 w-3 rounded-full border border-rule-strong" />}
                    </span>
                    {o}
                  </button>
                )
              })}
            </div>
            {picked !== null && (
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                <span className={cx('font-semibold', picked === q.answer ? 'text-proto-http' : 'text-proto-error')}>{picked === q.answer ? 'Correct. ' : 'Not quite. '}</span>
                {q.explanation}
              </p>
            )}
          </fieldset>
        )
      })}
      {done && (
        <div className="flex items-center justify-between rounded-md border-[1.5px] border-edge px-4 py-3">
          <span className="text-sm">
            You got <strong>{score}</strong> of {questions.length} right.
          </span>
          <button onClick={() => setAnswers(questions.map(() => null))} className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      )}
    </div>
  )
}

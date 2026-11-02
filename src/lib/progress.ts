import { useEffect, useState } from 'react'
import { load, save } from './storage'

// Lesson progress lives only in this browser. No accounts, no server.

const KEY = 'pw.progress'

export function useProgress() {
  const [scores, setScores] = useState<Record<string, number>>(() => load(KEY, {}))
  useEffect(() => {
    save(KEY, scores)
  }, [scores])
  return {
    scores,
    record: (slug: string, score: number) => setScores((s) => ({ ...s, [slug]: Math.max(score, s[slug] ?? 0) })),
  }
}

import { describe, it, expect } from 'vitest'

const FREE_LIMITS: Record<string, number> = {
  documents_per_month: 5,
  ai_generations_per_month: 100,
  quiz_generations_per_month: 20,
  flashcard_generations_per_month: 30,
  tutor_questions_per_day: 20,
}

function checkLimit(feature: string, used: number, tier: 'free' | 'pro' = 'free'): { allowed: boolean; remaining: number } {
  const limits = tier === 'pro'
    ? { documents_per_month: 50, ai_generations_per_month: 1000, quiz_generations_per_month: 200, flashcard_generations_per_month: 300, tutor_questions_per_day: 200 }
    : FREE_LIMITS
  const limit = limits[feature] ?? 100
  return { allowed: used < limit, remaining: Math.max(0, limit - used) }
}

describe('usage limits', () => {
  it('allows when under limit', () => {
    expect(checkLimit('documents_per_month', 3).allowed).toBe(true)
  })

  it('blocks when at limit', () => {
    expect(checkLimit('documents_per_month', 5).allowed).toBe(false)
  })

  it('blocks when over limit', () => {
    expect(checkLimit('ai_generations_per_month', 105).allowed).toBe(false)
  })

  it('calculates remaining correctly', () => {
    expect(checkLimit('quiz_generations_per_month', 12).remaining).toBe(8)
  })

  it('remaining is 0 when at limit', () => {
    expect(checkLimit('documents_per_month', 5).remaining).toBe(0)
  })

  it('pro tier has higher limits', () => {
    expect(checkLimit('documents_per_month', 10, 'pro').allowed).toBe(true)
    expect(checkLimit('documents_per_month', 10, 'free').allowed).toBe(false)
  })
})

describe('weak topic detection', () => {
  interface TopicStat { topic: string; correct: number; total: number }

  function detectWeakTopics(stats: TopicStat[], threshold = 70, minAttempts = 3): string[] {
    return stats
      .filter(s => s.total >= minAttempts)
      .filter(s => Math.round((s.correct / s.total) * 100) < threshold)
      .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
      .map(s => s.topic)
  }

  it('identifies weak topics below threshold', () => {
    const stats = [
      { topic: 'Normalization', correct: 2, total: 5 },  // 40% → weak
      { topic: 'SQL',           correct: 4, total: 5 },  // 80% → ok
      { topic: 'Transactions',  correct: 3, total: 5 },  // 60% → weak
    ]
    const weak = detectWeakTopics(stats)
    expect(weak).toContain('Normalization')
    expect(weak).toContain('Transactions')
    expect(weak).not.toContain('SQL')
  })

  it('ignores topics with insufficient attempts', () => {
    const stats = [{ topic: 'Indexing', correct: 0, total: 1 }]
    expect(detectWeakTopics(stats)).toHaveLength(0)
  })

  it('sorts by accuracy ascending', () => {
    const stats = [
      { topic: 'B', correct: 3, total: 5 }, // 60%
      { topic: 'A', correct: 1, total: 5 }, // 20%
    ]
    const weak = detectWeakTopics(stats)
    expect(weak[0]).toBe('A') // worst first
  })

  it('returns empty when all topics are strong', () => {
    const stats = [{ topic: 'SQL', correct: 4, total: 5 }] // 80%
    expect(detectWeakTopics(stats)).toHaveLength(0)
  })
})

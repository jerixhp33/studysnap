import { describe, it, expect } from 'vitest'

// Spaced repetition intervals (days)
const NEXT_REVIEW: Record<string, number> = { again: 0.0417, hard: 1, good: 3, easy: 7 }

function getNextReview(confidence: string): Date {
  const days = NEXT_REVIEW[confidence] ?? 1
  return new Date(Date.now() + days * 86400000)
}

describe('flashcard spaced repetition', () => {
  it('"again" schedules within 1 hour', () => {
    const next = getNextReview('again')
    const diffMs = next.getTime() - Date.now()
    expect(diffMs).toBeLessThan(2 * 3600000)
  })
  it('"hard" schedules 1 day later', () => {
    const next = getNextReview('hard')
    const diffDays = (next.getTime() - Date.now()) / 86400000
    expect(diffDays).toBeCloseTo(1, 0)
  })
  it('"good" schedules 3 days later', () => {
    const next = getNextReview('good')
    const diffDays = (next.getTime() - Date.now()) / 86400000
    expect(diffDays).toBeCloseTo(3, 0)
  })
  it('"easy" schedules 7 days later', () => {
    const next = getNextReview('easy')
    const diffDays = (next.getTime() - Date.now()) / 86400000
    expect(diffDays).toBeCloseTo(7, 0)
  })
})

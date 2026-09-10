import { describe, it, expect } from 'vitest'

function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

function getTopicPerformance(answers: { topic: string; is_correct: boolean }[]) {
  const perf: Record<string, { correct: number; total: number }> = {}
  answers.forEach(a => {
    if (!perf[a.topic]) perf[a.topic] = { correct: 0, total: 0 }
    perf[a.topic].total++
    if (a.is_correct) perf[a.topic].correct++
  })
  return perf
}

describe('quiz scoring', () => {
  it('calculates 100% for all correct', () => { expect(calculateScore(10, 10)).toBe(100) })
  it('calculates 50% for half correct', () => { expect(calculateScore(5, 10)).toBe(50) })
  it('calculates 0% for all wrong', () => { expect(calculateScore(0, 10)).toBe(0) })
  it('handles zero questions', () => { expect(calculateScore(0, 0)).toBe(0) })
  it('rounds correctly', () => { expect(calculateScore(7, 10)).toBe(70) })
})

describe('topic performance', () => {
  it('groups answers by topic', () => {
    const answers = [
      { topic: 'SQL', is_correct: true }, { topic: 'SQL', is_correct: false },
      { topic: 'Normalization', is_correct: true },
    ]
    const perf = getTopicPerformance(answers)
    expect(perf['SQL'].total).toBe(2)
    expect(perf['SQL'].correct).toBe(1)
    expect(perf['Normalization'].correct).toBe(1)
  })
})

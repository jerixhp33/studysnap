import { describe, it, expect } from 'vitest'
import { MockProvider } from '../../src/lib/ai/mock-provider'

const ai = new MockProvider()

describe('MockProvider — generateSummary', () => {
  it('returns required fields', async () => {
    const result = await ai.generateSummary({
      content: 'Test content', summaryType: 'quick',
      language: 'english', difficulty: 'college',
    })
    expect(result.title).toBeTruthy()
    expect(Array.isArray(result.key_points)).toBe(true)
    expect(result.key_points.length).toBeGreaterThan(0)
    expect(Array.isArray(result.definitions)).toBe(true)
    expect(Array.isArray(result.exam_tips)).toBe(true)
  })
})

describe('MockProvider — generateQuiz', () => {
  it('returns requested number of questions', async () => {
    const result = await ai.generateQuiz({
      content: 'Test', questionCount: 5, difficulty: 'medium',
      questionTypes: ['mcq'], language: 'english',
    })
    expect(result).toHaveLength(5)
  })

  it('each question has required fields', async () => {
    const result = await ai.generateQuiz({
      content: 'Test', questionCount: 3, difficulty: 'easy',
      questionTypes: ['mcq'], language: 'english',
    })
    for (const q of result) {
      expect(q.question).toBeTruthy()
      expect(q.correct_answer).toBeTruthy()
      expect(q.explanation).toBeTruthy()
      expect(q.difficulty).toBe('easy')
      expect(Array.isArray(q.options)).toBe(true)
    }
  })
})

describe('MockProvider — generateFlashcards', () => {
  it('returns requested number of cards', async () => {
    const result = await ai.generateFlashcards({
      content: 'Test', cardCount: 10, difficulty: 'medium', language: 'english',
    })
    expect(result).toHaveLength(10)
  })

  it('each card has front and back', async () => {
    const result = await ai.generateFlashcards({
      content: 'Test', cardCount: 3, difficulty: 'hard', language: 'english',
    })
    for (const card of result) {
      expect(card.front).toBeTruthy()
      expect(card.back).toBeTruthy()
    }
  })
})

describe('MockProvider — evaluateAnswer', () => {
  it('score is within marks range', async () => {
    const result = await ai.evaluateAnswer({
      question: 'What is a database?', studentAnswer: 'A database stores data.',
      referenceContent: '', marks: 5,
    })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(result.max_score)
    expect(result.max_score).toBe(5)
  })

  it('returns feedback arrays', async () => {
    const result = await ai.evaluateAnswer({
      question: 'Explain normalization.', studentAnswer: 'It reduces redundancy.',
      referenceContent: '', marks: 10,
    })
    expect(Array.isArray(result.strengths)).toBe(true)
    expect(Array.isArray(result.missing_concepts)).toBe(true)
    expect(Array.isArray(result.suggestions)).toBe(true)
    expect(result.improved_answer).toBeTruthy()
  })
})

describe('MockProvider — generateStudyPlan', () => {
  it('generates tasks for each unit', async () => {
    const units = ['SQL', 'Normalization', 'Transactions']
    const result = await ai.generateStudyPlan({
      subject: 'DBMS', units, examDate: '2025-12-01',
      dailyMinutes: 120, currentLevel: 'medium',
    })
    expect(result.tasks.length).toBeGreaterThan(0)
    expect(result.strategy).toBeTruthy()
    for (const task of result.tasks) {
      expect(task.title).toBeTruthy()
      expect(task.scheduled_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(task.duration_minutes).toBeGreaterThan(0)
    }
  })
})

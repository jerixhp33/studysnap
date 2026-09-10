import { describe, it, expect } from 'vitest'
import { computeEarnedBadges } from '../../src/lib/badges'

describe('computeEarnedBadges', () => {
  it('awards first_quiz on first attempt', () => {
    const earned = computeEarnedBadges({ userId: 'u1', quizAttemptCount: 1 })
    expect(earned).toContain('first_quiz')
  })

  it('does not award first_quiz on subsequent attempts', () => {
    const earned = computeEarnedBadges({ userId: 'u1', quizAttemptCount: 5 })
    expect(earned).not.toContain('first_quiz')
  })

  it('awards quiz_master for 100% score', () => {
    const earned = computeEarnedBadges({ userId: 'u1', quizScore: 100 })
    expect(earned).toContain('quiz_master')
  })

  it('does not award quiz_master for < 100%', () => {
    const earned = computeEarnedBadges({ userId: 'u1', quizScore: 99 })
    expect(earned).not.toContain('quiz_master')
  })

  it('awards streak badges correctly', () => {
    expect(computeEarnedBadges({ userId: 'u1', streakDays: 3 })).toContain('streak_3')
    expect(computeEarnedBadges({ userId: 'u1', streakDays: 7 })).toContain('streak_7')
    expect(computeEarnedBadges({ userId: 'u1', streakDays: 30 })).toContain('streak_30')
    expect(computeEarnedBadges({ userId: 'u1', streakDays: 2 })).not.toContain('streak_3')
  })

  it('awards first_upload on first document', () => {
    const earned = computeEarnedBadges({ userId: 'u1', documentCount: 1 })
    expect(earned).toContain('first_upload')
  })

  it('awards hundred_flashcards at 100 reviews', () => {
    const earned = computeEarnedBadges({ userId: 'u1', flashcardReviewCount: 100 })
    expect(earned).toContain('hundred_flashcards')
    expect(earned).toContain('first_flashcard')
  })

  it('awards tutor badge at 10 questions', () => {
    const earned = computeEarnedBadges({ userId: 'u1', tutorQuestionCount: 10 })
    expect(earned).toContain('tutor_10')
  })

  it('returns empty array for no achievements', () => {
    const earned = computeEarnedBadges({ userId: 'u1' })
    expect(earned).toHaveLength(0)
  })

  it('can earn multiple badges at once', () => {
    const earned = computeEarnedBadges({
      userId: 'u1', quizAttemptCount: 1, quizScore: 100, streakDays: 7, documentCount: 1,
    })
    expect(earned.length).toBeGreaterThan(3)
    expect(earned).toContain('first_quiz')
    expect(earned).toContain('quiz_master')
    expect(earned).toContain('streak_7')
  })
})

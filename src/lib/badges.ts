/**
 * Badge definitions and award logic.
 * Call awardBadges() after significant user actions.
 */

export interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  xp: number
}

export const BADGES: Record<string, Badge> = {
  first_quiz: {
    id: 'first_quiz', name: 'Quiz Starter', emoji: '🎯',
    description: 'Completed your first quiz', xp: 50,
  },
  quiz_master: {
    id: 'quiz_master', name: 'Quiz Master', emoji: '🏆',
    description: 'Scored 100% on a quiz', xp: 100,
  },
  streak_3: {
    id: 'streak_3', name: '3-Day Streak', emoji: '🔥',
    description: 'Studied 3 days in a row', xp: 75,
  },
  streak_7: {
    id: 'streak_7', name: 'Week Warrior', emoji: '⚡',
    description: 'Studied 7 days in a row', xp: 200,
  },
  streak_30: {
    id: 'streak_30', name: 'Monthly Champion', emoji: '💎',
    description: 'Studied 30 days in a row', xp: 500,
  },
  first_flashcard: {
    id: 'first_flashcard', name: 'Card Creator', emoji: '⚡',
    description: 'Created your first flashcard set', xp: 50,
  },
  hundred_flashcards: {
    id: 'hundred_flashcards', name: 'Flash Champion', emoji: '🌟',
    description: 'Reviewed 100 flashcards', xp: 150,
  },
  first_summary: {
    id: 'first_summary', name: 'Note Ninja', emoji: '📝',
    description: 'Generated your first AI summary', xp: 50,
  },
  first_upload: {
    id: 'first_upload', name: 'Note Uploader', emoji: '📚',
    description: 'Uploaded your first document', xp: 25,
  },
  subject_complete: {
    id: 'subject_complete', name: 'Subject Ace', emoji: '🎓',
    description: 'Covered all topics in a subject', xp: 250,
  },
  tutor_10: {
    id: 'tutor_10', name: 'Curious Learner', emoji: '🧠',
    description: 'Asked the AI tutor 10 questions', xp: 75,
  },
}

export interface BadgeCheckInput {
  userId: string
  quizScore?: number           // 0-100 percentage
  quizAttemptCount?: number
  streakDays?: number
  flashcardReviewCount?: number
  summaryCount?: number
  documentCount?: number
  tutorQuestionCount?: number
}

/** Returns list of badge IDs earned based on current stats */
export function computeEarnedBadges(input: BadgeCheckInput): string[] {
  const earned: string[] = []

  if (input.quizAttemptCount === 1) earned.push('first_quiz')
  if (input.quizScore === 100) earned.push('quiz_master')
  if ((input.streakDays ?? 0) >= 3) earned.push('streak_3')
  if ((input.streakDays ?? 0) >= 7) earned.push('streak_7')
  if ((input.streakDays ?? 0) >= 30) earned.push('streak_30')
  if (input.summaryCount === 1) earned.push('first_summary')
  if (input.documentCount === 1) earned.push('first_upload')
  if ((input.flashcardReviewCount ?? 0) >= 1) earned.push('first_flashcard')
  if ((input.flashcardReviewCount ?? 0) >= 100) earned.push('hundred_flashcards')
  if ((input.tutorQuestionCount ?? 0) >= 10) earned.push('tutor_10')

  return earned
}

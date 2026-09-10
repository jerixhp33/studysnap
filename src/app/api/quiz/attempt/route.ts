import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { computeEarnedBadges } from '@/lib/badges'

const attemptSchema = z.object({
  quiz_id: z.string().uuid(),
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    user_answer: z.string(),
    is_correct: z.boolean(),
    topic: z.string().optional(),
  })),
  time_taken_seconds: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const input = attemptSchema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const admin = createAdminClient()
    const { answers, quiz_id } = input.data
    const correct = answers.filter(a => a.is_correct).length
    const total = answers.length
    const score = total > 0 ? Math.round((correct / total) * 100) : 0

    const topicPerf: Record<string, { correct: number; total: number }> = {}
    answers.forEach(a => {
      const t = a.topic ?? 'General'
      if (!topicPerf[t]) topicPerf[t] = { correct: 0, total: 0 }
      topicPerf[t].total++
      if (a.is_correct) topicPerf[t].correct++
    })

    const { data: attempt, error } = await admin.from('quiz_attempts').insert({
      quiz_id, user_id: user.id, score, total_questions: total,
      correct_count: correct, incorrect_count: total - correct,
      time_taken_seconds: input.data.time_taken_seconds ?? null,
      completed_at: new Date().toISOString(),
      topic_performance: topicPerf,
    }).select().single()
    if (error) throw error

    if (answers.length > 0) {
      await admin.from('quiz_answers').insert(
        answers.map(a => ({ attempt_id: attempt.id, question_id: a.question_id, user_answer: a.user_answer, is_correct: a.is_correct }))
      )
    }

    // Update weak topics
    for (const [topic, stats] of Object.entries(topicPerf)) {
      const accuracy = Math.round((stats.correct / stats.total) * 100)
      await admin.from('weak_topics').upsert({
        user_id: user.id, topic, accuracy_percentage: accuracy,
        attempt_count: stats.total, last_attempted: new Date().toISOString(),
        needs_revision: accuracy < 70, subject_id: null,
      }, { onConflict: 'user_id,topic,subject_id' })
    }

    // XP reward
    const xpGained = Math.round(score / 10) + (score === 100 ? 5 : 0)
    if (xpGained > 0) {
      const { data: prof } = await admin.from('profiles').select('total_xp').eq('id', user.id).single()
      await admin.from('profiles').update({ total_xp: (prof?.total_xp ?? 0) + xpGained }).eq('id', user.id)
    }

    // Award badges
    const { count: quizCount } = await admin.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: aiGenCount } = await admin.from('ai_generations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('feature', 'tutor')
    const { data: profBadge } = await admin.from('profiles').select('streak_days').eq('id', user.id).single()
    const earnedBadgeIds = computeEarnedBadges({
      userId: user.id,
      quizScore: score,
      quizAttemptCount: quizCount ?? undefined,
      streakDays: profBadge?.streak_days ?? 0,
      tutorQuestionCount: aiGenCount ?? undefined,
    })
    for (const badgeId of earnedBadgeIds) {
      await admin.from('user_badges').upsert({ user_id: user.id, badge_id: badgeId }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })
    }

    return NextResponse.json({ data: { attempt, score, correct, total, topic_performance: topicPerf, new_badges: earnedBadgeIds } })
  } catch (error) {
    console.error('Attempt save error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

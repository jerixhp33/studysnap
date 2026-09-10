import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProgressClient } from '@/components/progress/progress-client'
import { BadgesDisplay } from '@/components/dashboard/badges-display'

export const metadata = { title: 'Progress' }

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const weekAgo  = new Date(now.getTime() -  7 * 86400000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  const [profileRes, sessionsRes, attemptsRes, weakRes, cardsRes, badgesRes] = await Promise.all([
    supabase.from('profiles').select('streak_days, total_xp').eq('id', user.id).single(),
    supabase.from('study_sessions')
      .select('duration_seconds, activity_type, started_at')
      .eq('user_id', user.id)
      .gte('started_at', monthAgo)
      .order('started_at'),
    supabase.from('quiz_attempts')
      .select('score, correct_count, total_questions, completed_at, topic_performance')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('created_at', monthAgo)
      .order('created_at'),
    supabase.from('weak_topics')
      .select('topic, accuracy_percentage, attempt_count, needs_revision, subject_id')
      .eq('user_id', user.id)
      .order('accuracy_percentage'),
    supabase.from('flashcards')
      .select('confidence, review_count, next_review')
      .eq('user_id', user.id),
    supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
  ])

  const sessions  = sessionsRes.data  ?? []
  const attempts  = attemptsRes.data  ?? []
  const weakTopics = weakRes.data     ?? []
  const cards     = cardsRes.data     ?? []
  const profile   = profileRes.data
  const badges    = (badgesRes.data ?? []).map(b => b.badge_id)

  const weeklyMinutes  = Math.round(sessions.filter(s => new Date(s.started_at) > new Date(weekAgo)).reduce((a, s) => a + (s.duration_seconds ?? 0), 0) / 60)
  const monthlyMinutes = Math.round(sessions.reduce((a, s) => a + (s.duration_seconds ?? 0), 0) / 60)
  const avgQuizScore   = attempts.length > 0 ? Math.round(attempts.reduce((a, q) => a + (q.score ?? 0), 0) / attempts.length) : 0
  const dueCards       = cards.filter(c => !c.next_review || new Date(c.next_review) <= now).length
  const reviewedCards  = cards.filter(c => c.confidence).length

  // Daily study chart — last 7 days
  const dailyStudy = Array.from({ length: 7 }, (_, i) => {
    const d     = new Date(now.getTime() - (6 - i) * 86400000)
    const dayStr  = d.toISOString().split('T')[0]
    const label   = d.toLocaleDateString('en', { weekday: 'short' })
    const minutes = Math.round(sessions.filter(s => s.started_at.startsWith(dayStr)).reduce((a, s) => a + (s.duration_seconds ?? 0), 0) / 60)
    return { day: label, minutes }
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Progress</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">Your learning journey this month</p>
      </div>

      <ProgressClient
        weeklyMinutes={weeklyMinutes}
        monthlyMinutes={monthlyMinutes}
        avgQuizScore={avgQuizScore}
        streakDays={profile?.streak_days ?? 0}
        totalXp={profile?.total_xp ?? 0}
        dueCards={dueCards}
        reviewedCards={reviewedCards}
        totalCards={cards.length}
        weakTopics={weakTopics as never}
        dailyStudy={dailyStudy}
        attempts={attempts.slice(-5).map(a => ({
          score: a.score ?? 0,
          correct_count: a.correct_count ?? 0,
          total_questions: a.total_questions ?? 0,
          completed_at: a.completed_at ?? '',
        }))}
      />

      <BadgesDisplay earnedBadgeIds={badges} />
    </div>
  )
}

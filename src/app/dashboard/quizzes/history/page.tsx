import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Trophy, Target } from 'lucide-react'
import { formatDate, formatDuration } from '@/lib/utils'

export const metadata = { title: 'Quiz History' }

export default async function QuizHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select(`
      id, score, correct_count, incorrect_count, total_questions,
      time_taken_seconds, completed_at, topic_performance,
      quizzes:quizzes(id, title, difficulty, subject_id,
        subjects:subjects(name, color))
    `)
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(50)

  const avgScore = attempts && attempts.length > 0
    ? Math.round(attempts.reduce((a, q) => a + (q.score ?? 0), 0) / attempts.length)
    : 0

  const bestScore = attempts && attempts.length > 0
    ? Math.round(Math.max(...attempts.map(q => q.score ?? 0)))
    : 0

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/quizzes" className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
          <ChevronLeft className="h-5 w-5 text-[var(--muted-foreground)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quiz History</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
            {attempts?.length ?? 0} attempts
          </p>
        </div>
      </div>

      {/* Summary stats */}
      {(attempts?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Attempts', value: attempts?.length ?? 0, icon: Target },
            { label: 'Average Score',  value: `${avgScore}%`,        icon: Trophy },
            { label: 'Best Score',     value: `${bestScore}%`,       icon: Trophy },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <Icon className="h-5 w-5 text-[var(--primary)] mx-auto mb-2" />
              <p className="text-xl font-bold text-[var(--foreground)]">{value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attempts list */}
      {!attempts || attempts.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
          <Trophy className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-[var(--foreground)]">No quiz attempts yet</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Take your first quiz to see your history here</p>
          <Link href="/dashboard/quizzes"
            className="mt-4 inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[var(--primary-dark)] transition-colors">
            Take a Quiz
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map(attempt => {
            const pct = Math.round(attempt.score ?? 0)
            const quiz = attempt.quizzes as unknown as { title: string; difficulty: string; subjects?: { name: string; color: string } | null } | null
            const topicPerf = attempt.topic_performance as Record<string, { correct: number; total: number }> | null

            return (
              <div key={attempt.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-start gap-4">
                  {/* Score badge */}
                  <div className={`shrink-0 h-14 w-14 rounded-xl flex flex-col items-center justify-center font-bold text-lg ${
                    pct >= 80 ? 'bg-[var(--success-bg)] text-[var(--success)]' :
                    pct >= 60 ? 'bg-[var(--warning-bg)] text-[var(--warning)]' :
                    'bg-[var(--error-bg)] text-[var(--error)]'
                  }`}>
                    {pct}
                    <span className="text-[10px] font-normal opacity-70">%</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--foreground)] truncate">
                      {quiz?.title ?? 'Quiz'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {quiz?.subjects && (
                        <span className="text-xs text-[var(--muted-foreground)]">{quiz.subjects.name}</span>
                      )}
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {attempt.correct_count}/{attempt.total_questions} correct
                      </span>
                      {attempt.time_taken_seconds && (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {formatDuration(attempt.time_taken_seconds)}
                        </span>
                      )}
                      <span className="text-xs text-[var(--muted-foreground)] capitalize">
                        {quiz?.difficulty}
                      </span>
                    </div>

                    {/* Score bar */}
                    <div className="mt-2 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)',
                      }} />
                    </div>

                    {/* Topic performance breakdown */}
                    {topicPerf && Object.keys(topicPerf).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(topicPerf).slice(0, 4).map(([topic, stats]) => {
                          const p = Math.round((stats.correct / stats.total) * 100)
                          return (
                            <span key={topic} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              p >= 70 ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--error-bg)] text-[var(--error)]'
                            }`}>
                              {topic} {p}%
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-[var(--muted-foreground)] shrink-0 mt-0.5">
                    {attempt.completed_at ? formatDate(attempt.completed_at) : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

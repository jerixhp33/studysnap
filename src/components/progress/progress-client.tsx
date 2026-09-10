'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Clock, Zap, Brain, Target, AlertTriangle, Trophy, Flame } from 'lucide-react'

interface Props {
  weeklyMinutes: number; monthlyMinutes: number; avgQuizScore: number; streakDays: number
  totalXp: number; dueCards: number; reviewedCards: number; totalCards: number
  weakTopics: { topic: string; accuracy_percentage: number; attempt_count: number; needs_revision: boolean }[]
  dailyStudy: { day: string; minutes: number }[]
  attempts: { score: number; correct_count: number; total_questions: number; completed_at: string }[]
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${color}`}><Icon className="h-4 w-4" /></div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[var(--muted-foreground)] mt-0.5 opacity-70">{sub}</p>}
    </div>
  )
}

export function ProgressClient({ weeklyMinutes, monthlyMinutes, avgQuizScore, streakDays, totalXp, dueCards, reviewedCards, totalCards, weakTopics, dailyStudy, attempts }: Props) {
  const maxDaily = Math.max(...dailyStudy.map(d => d.minutes), 1)

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Flame} label="Study Streak" value={`${streakDays}d`} sub="keep it going!" color="bg-[var(--warning-bg)] text-[var(--warning)]" />
        <StatCard icon={Clock} label="This Week" value={`${weeklyMinutes}m`} sub={`${monthlyMinutes}m this month`} color="bg-[var(--info-bg)] text-[var(--info)]" />
        <StatCard icon={Target} label="Quiz Average" value={`${avgQuizScore}%`} sub={`${attempts.length} attempts`} color="bg-[var(--primary)]/10 text-[var(--primary)]" />
        <StatCard icon={Trophy} label="Total XP" value={totalXp} sub="keep earning!" color="bg-[var(--success-bg)] text-[var(--success)]" />
      </div>

      {/* Daily study chart */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Study Time (Last 7 Days)</h2>
        {dailyStudy.some(d => d.minutes > 0) ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyStudy} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} formatter={(v: unknown) => [`${v as number}m`, "Study time"]} />
              <Bar dataKey="minutes" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
            No study sessions this week. Start studying to see your progress!
          </div>
        )}
      </div>

      {/* Flashcard progress */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Flashcard Progress</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[{ label: 'Total', value: totalCards, color: 'text-[var(--foreground)]' },{ label: 'Reviewed', value: reviewedCards, color: 'text-[var(--success)]' },{ label: 'Due', value: dueCards, color: 'text-[var(--error)]' }].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        {totalCards > 0 && (
          <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--success)] rounded-full" style={{ width: `${Math.round((reviewedCards / totalCards) * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
            <h2 className="font-semibold text-[var(--foreground)]">Weak Topics</h2>
          </div>
          <div className="space-y-3">
            {weakTopics.slice(0, 8).map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--foreground)] font-medium truncate flex-1 mr-3">{t.topic}</span>
                  <span className={`font-semibold shrink-0 ${t.accuracy_percentage < 50 ? 'text-[var(--error)]' : t.accuracy_percentage < 70 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>{Math.round(t.accuracy_percentage)}%</span>
                </div>
                <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${t.accuracy_percentage}%`, backgroundColor: t.accuracy_percentage < 50 ? 'var(--error)' : t.accuracy_percentage < 70 ? 'var(--warning)' : 'var(--success)' }} />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{t.attempt_count} attempts</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent quiz scores */}
      {attempts.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-4">Recent Quiz Results</h2>
          <div className="space-y-2">
            {attempts.map((a, i) => {
              const pct = Math.round((a.correct_count / a.total_questions) * 100)
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${pct >= 80 ? 'bg-[var(--success-bg)] text-[var(--success)]' : pct >= 60 ? 'bg-[var(--warning-bg)] text-[var(--warning)]' : 'bg-[var(--error-bg)] text-[var(--error)]'}`}>{pct}%</div>
                  <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)' }} /></div>
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0">{a.correct_count}/{a.total_questions}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {attempts.length === 0 && weakTopics.length === 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-10 text-center">
          <TrendingUp className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">No progress data yet</p>
          <p className="text-xs text-[var(--muted-foreground)]">Take quizzes and study sessions to see your progress here</p>
        </div>
      )}
    </div>
  )
}

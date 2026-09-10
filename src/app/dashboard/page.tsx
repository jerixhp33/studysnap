import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Zap, HelpCircle, Brain, BookOpen, TrendingUp, Calendar, AlertTriangle } from 'lucide-react'
import { getGreeting, formatDate } from '@/lib/utils'
import { StudyTimer } from '@/components/dashboard/study-timer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, subjectsRes, examsRes, recentDocsRes, weakTopicsRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, streak_days, total_xp').eq('id', user.id).single(),
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).eq('archived', false).limit(5),
    supabase.from('exams').select('id, name, exam_date, subject_id').eq('user_id', user.id)
      .gte('exam_date', new Date().toISOString().split('T')[0]).order('exam_date').limit(3),
    supabase.from('documents').select('id, name, status, created_at, subject_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('weak_topics').select('topic, accuracy_percentage, subject_id').eq('user_id', user.id).eq('needs_revision', true).order('accuracy_percentage').limit(3),
    supabase.from('study_sessions').select('duration_seconds').eq('user_id', user.id)
      .gte('started_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  const profile = profileRes.data
  const subjects = subjectsRes.data ?? []
  const exams = examsRes.data ?? []
  const recentDocs = recentDocsRes.data ?? []
  const weakTopics = weakTopicsRes.data ?? []
  const sessions = sessionsRes.data ?? []

  const weeklyMinutes = Math.round(sessions.reduce((a, s) => a + (s.duration_seconds ?? 0), 0) / 60)
  const greeting = getGreeting()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'

  const todayTasks = await supabase.from('study_tasks')
    .select('id, title, task_type, status, duration_minutes')
    .eq('user_id', user.id)
    .eq('scheduled_date', new Date().toISOString().split('T')[0])
    .order('status')
  const tasks = todayTasks.data ?? []
  const completedTasks = tasks.filter(t => t.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          {tasks.length > 0 ? `${completedTasks}/${tasks.length} tasks done today` : "Ready to study? Let's go!"}
        </p>
      </div>

      {/* Study Timer */}
      <div className="max-w-xs">
        <StudyTimer activityType="study" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Study Streak', value: `${profile?.streak_days ?? 0} days`, icon: '🔥', color: 'bg-[var(--warning-bg)] text-[var(--warning)]' },
          { label: 'Weekly Study', value: `${weeklyMinutes}m`, icon: '⏱️', color: 'bg-[var(--info-bg)] text-[var(--info)]' },
          { label: 'Total XP', value: `${profile?.total_xp ?? 0}`, icon: '⭐', color: 'bg-[var(--primary)]/10 text-[var(--primary)]' },
          { label: 'Subjects', value: `${subjects.length}`, icon: '📚', color: 'bg-[var(--success-bg)] text-[var(--success)]' },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${stat.color}`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Upload Notes', icon: FileText, href: '/dashboard/notes?upload=1', color: 'bg-[var(--primary)]/10 text-[var(--primary)]' },
            { label: 'Start Quiz', icon: HelpCircle, href: '/dashboard/quizzes', color: 'bg-[var(--success-bg)] text-[var(--success)]' },
            { label: 'Flashcards', icon: Zap, href: '/dashboard/flashcards', color: 'bg-[var(--warning-bg)] text-[var(--warning)]' },
            { label: 'Ask AI Tutor', icon: Brain, href: '/dashboard/tutor', color: 'bg-[var(--info-bg)] text-[var(--info)]' },
          ].map(({ label, icon: Icon, href, color }) => (
            <Link key={label} href={href} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 flex flex-col items-center gap-2 hover:border-[var(--primary)] hover:shadow-sm transition-all group">
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)] text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Upcoming Exams */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Upcoming Exams</h2>
            <Link href="/dashboard/exams" className="text-xs text-[var(--primary)] hover:underline">View all</Link>
          </div>
          {exams.length === 0 ? (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 text-center">
              <Calendar className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-[var(--muted-foreground)]">No upcoming exams</p>
              <Link href="/dashboard/exams" className="text-xs text-[var(--primary)] mt-2 inline-block hover:underline">Add exam →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {exams.map(exam => {
                const days = Math.ceil((new Date(exam.exam_date).getTime() - Date.now()) / 86400000)
                return (
                  <div key={exam.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                    <p className="font-medium text-sm text-[var(--foreground)]">{exam.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatDate(exam.exam_date)}</p>
                    <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${days <= 3 ? 'bg-[var(--error-bg)] text-[var(--error)]' : days <= 7 ? 'bg-[var(--warning-bg)] text-[var(--warning)]' : 'bg-[var(--success-bg)] text-[var(--success)]'}`}>
                      {days <= 0 ? 'Today!' : `${days} day${days !== 1 ? 's' : ''} left`}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Today's Tasks</h2>
            <Link href="/dashboard/exams" className="text-xs text-[var(--primary)] hover:underline">Planner</Link>
          </div>
          {tasks.length === 0 ? (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 text-center">
              <TrendingUp className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-[var(--muted-foreground)]">No tasks scheduled</p>
              <Link href="/dashboard/exams" className="text-xs text-[var(--primary)] mt-2 inline-block hover:underline">Plan your study →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className={`bg-[var(--card)] rounded-xl border p-3 flex items-start gap-3 ${task.status === 'completed' ? 'border-[var(--success)] opacity-70' : 'border-[var(--border)]'}`}>
                  <div className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${task.status === 'completed' ? 'bg-[var(--success)] border-[var(--success)]' : 'border-[var(--border)]'}`}>
                    {task.status === 'completed' && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>{task.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{task.duration_minutes}m · {task.task_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Needs Revision</h2>
            <Link href="/dashboard/progress" className="text-xs text-[var(--primary)] hover:underline">View all</Link>
          </div>
          {weakTopics.length === 0 ? (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 text-center">
              <AlertTriangle className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-[var(--muted-foreground)]">Take some quizzes to see weak areas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {weakTopics.map(topic => (
                <div key={topic.topic} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{topic.topic}</p>
                    <span className="text-xs font-semibold text-[var(--error)] shrink-0 ml-2">{Math.round(topic.accuracy_percentage)}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--error)] rounded-full transition-all" style={{ width: `${topic.accuracy_percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Notes */}
      {recentDocs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Recent Notes</h2>
            <Link href="/dashboard/notes" className="text-xs text-[var(--primary)] hover:underline">View all</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentDocs.map(doc => (
              <Link key={doc.id} href={`/dashboard/notes/${doc.id}`} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-[var(--primary)] shrink-0" />
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${doc.status === 'ready' ? 'bg-[var(--success-bg)] text-[var(--success)]' : doc.status === 'failed' ? 'bg-[var(--error-bg)] text-[var(--error)]' : 'bg-[var(--warning-bg)] text-[var(--warning)]'}`}>
                    {doc.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)] truncate">{doc.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">{formatDate(doc.created_at)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

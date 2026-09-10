'use client'
import { useState } from 'react'
import { Calendar, Plus, Loader2, CheckCircle, Clock, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { getDaysUntil, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Exam { id: string; name: string; exam_date: string; daily_available_minutes: number; units: string[]; subjects?: { name: string; color: string } | null }
interface Task { id: string; title: string; description: string | null; task_type: string; scheduled_date: string; duration_minutes: number; status: string }
interface Props { exams: Exam[]; tasks: Task[]; subjects: { id: string; name: string; color: string }[] }

export function ExamPlannerClient({ exams, tasks, subjects }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState('')
  const [minutes, setMinutes] = useState(120)
  const [units, setUnits] = useState('')
  const [level, setLevel] = useState('medium')
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {}
  tasks.forEach(t => {
    if (!tasksByDate[t.scheduled_date]) tasksByDate[t.scheduled_date] = []
    tasksByDate[t.scheduled_date].push(t)
  })
  const upcomingDates = Object.keys(tasksByDate).sort().slice(0, 7)

  async function createExam(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !date) return
    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const unitList = units.split(',').map(u => u.trim()).filter(Boolean)
      const { data: exam, error } = await supabase.from('exams').insert({
        user_id: user.id, name, subject_id: subjectId || null, exam_date: date,
        daily_available_minutes: minutes, current_knowledge_level: level, units: unitList,
      }).select().single()
      if (error) throw error

      // Generate study plan
      setGenerating(true)
      const res = await fetch('/api/ai/study-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: exam.id, subject: name, units: unitList, exam_date: date, daily_minutes: minutes, level }),
      })
      const { error: planErr } = await res.json()
      if (planErr) toast({ type: 'warning', title: 'Study plan could not be generated', description: 'You can still track your exam.' })
      else toast({ type: 'success', title: 'Exam added with study plan! 🎯' })

      setShowCreate(false); setName(''); setDate(''); setUnits(''); setSubjectId('')
      router.refresh()
    } catch (e) {
      toast({ type: 'error', title: 'Error', description: e instanceof Error ? e.message : 'Try again' })
    } finally { setCreating(false); setGenerating(false) }
  }

  async function completeTask(taskId: string) {
    await supabase.from('study_tasks').update({ status: 'completed' }).eq('id', taskId)
    router.refresh()
  }

  const TYPE_ICONS: Record<string, string> = { study: '📖', quiz: '✅', flashcards: '⚡', revision: '🔄', rest: '😴' }

  return (
    <div className="space-y-5">
      <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors">
        <Plus className="h-4 w-4" />Add Exam
      </button>

      {showCreate && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--foreground)]">New Exam</h2>
            <button onClick={() => setShowCreate(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={createExam} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Exam / Subject Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. DBMS Final Exam"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" />
              </div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Exam Date *</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" />
              </div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Daily Study Time (minutes)</label>
                <select value={minutes} onChange={e => setMinutes(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
                  {[60,90,120,180,240].map(m => <option key={m} value={m}>{m} min/day</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Current Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
                  <option value="easy">Confident</option><option value="medium">Some gaps</option><option value="hard">Starting fresh</option>
                </select>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Units / Topics (comma separated)</label>
              <input value={units} onChange={e => setUnits(e.target.value)} placeholder="e.g. Normalization, SQL, Transactions, Indexing"
                className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" />
            </div>
            {subjects.length > 0 && (
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Link to Subject (optional)</label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none">
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <button type="submit" disabled={creating || generating}
              className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {creating ? <><Loader2 className="h-4 w-4 animate-spin" />Creating...</>
                : generating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating study plan...</>
                : 'Add Exam & Generate Plan'}
            </button>
          </form>
        </div>
      )}

      {/* Upcoming exams */}
      {exams.length > 0 && (
        <div>
          <h2 className="font-semibold text-[var(--foreground)] mb-3">Upcoming Exams</h2>
          <div className="space-y-3">
            {exams.map(exam => {
              const days = getDaysUntil(exam.exam_date)
              return (
                <div key={exam.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[var(--foreground)]">{exam.name}</h3>
                        {exam.subjects && <span className="text-xs text-[var(--muted-foreground)]">· {exam.subjects.name}</span>}
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{formatDate(exam.exam_date)} · {exam.daily_available_minutes}min/day</p>
                      {exam.units?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exam.units.slice(0, 4).map(u => <span key={u} className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full">{u}</span>)}
                          {exam.units.length > 4 && <span className="text-xs text-[var(--muted-foreground)]">+{exam.units.length - 4}</span>}
                        </div>
                      )}
                    </div>
                    <div className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold text-center min-w-[60px] ${days <= 3 ? 'bg-[var(--error-bg)] text-[var(--error)]' : days <= 7 ? 'bg-[var(--warning-bg)] text-[var(--warning)]' : 'bg-[var(--success-bg)] text-[var(--success)]'}`}>
                      {days <= 0 ? 'Today' : `${days}d`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Study schedule */}
      {upcomingDates.length > 0 && (
        <div>
          <h2 className="font-semibold text-[var(--foreground)] mb-3">Study Schedule</h2>
          <div className="space-y-4">
            {upcomingDates.map(dateStr => {
              const dayTasks = tasksByDate[dateStr]
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              return (
                <div key={dateStr}>
                  <p className={`text-sm font-semibold mb-2 ${isToday ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
                    {isToday ? 'Today' : new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="space-y-2">
                    {dayTasks.map(task => (
                      <div key={task.id} className={`bg-[var(--card)] rounded-xl border p-3.5 flex items-start gap-3 transition-opacity ${task.status === 'completed' ? 'border-[var(--success)]/40 opacity-60' : 'border-[var(--border)]'}`}>
                        <button onClick={() => task.status !== 'completed' && completeTask(task.id)}
                          className={`mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-[var(--success)] border-[var(--success)]' : 'border-[var(--border)] hover:border-[var(--success)]'}`}>
                          {task.status === 'completed' && <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{TYPE_ICONS[task.task_type] ?? '📝'}</span>
                            <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>{task.title}</p>
                          </div>
                          {task.description && <p className="text-xs text-[var(--muted-foreground)] mt-0.5 ml-6">{task.description}</p>}
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)] shrink-0 flex items-center gap-1"><Clock className="h-3 w-3" />{task.duration_minutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {exams.length === 0 && tasks.length === 0 && !showCreate && (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-20 px-6 text-center">
          <Calendar className="h-12 w-12 text-[var(--muted-foreground)] mb-4 opacity-40" />
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">No exams planned</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-6">Add your upcoming exams and StudySnap AI will create a personalized day-by-day study plan.</p>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors">
            <Plus className="h-4 w-4" />Plan My First Exam
          </button>
        </div>
      )}
    </div>
  )
}

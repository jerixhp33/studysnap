import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExamPlannerClient } from '@/components/planner/exam-planner-client'

export const metadata = { title: 'Exam Planner' }

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [examsRes, tasksRes, subjectsRes] = await Promise.all([
    supabase.from('exams').select('*, subjects:subjects(name, color)').eq('user_id', user.id).order('exam_date'),
    supabase.from('study_tasks').select('*').eq('user_id', user.id).gte('scheduled_date', new Date().toISOString().split('T')[0]).order('scheduled_date').limit(30),
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).eq('archived', false),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Exam Planner</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">AI-powered study plans for your upcoming exams</p>
      </div>
      <ExamPlannerClient
        exams={examsRes.data as never ?? []}
        tasks={tasksRes.data as never ?? []}
        subjects={subjectsRes.data ?? []}
      />
    </div>
  )
}

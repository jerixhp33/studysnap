import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/ai'
import { z } from 'zod'

export const maxDuration = 60

const inputSchema = z.object({
  exam_id: z.string().uuid(),
  subject: z.string().min(1),
  units: z.array(z.string()),
  exam_date: z.string(),
  daily_minutes: z.number().min(30).max(480),
  level: z.enum(['easy', 'medium', 'hard']),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const input = inputSchema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const admin = createAdminClient()
    // Verify exam ownership
    const { data: exam } = await admin.from('exams').select('id').eq('id', input.data.exam_id).eq('user_id', user.id).single()
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    const ai = getAIProvider()
    const plan = await ai.generateStudyPlan({
      subject: input.data.subject,
      units: input.data.units,
      examDate: input.data.exam_date,
      dailyMinutes: input.data.daily_minutes,
      currentLevel: input.data.level,
    })

    if (plan.tasks.length === 0) return NextResponse.json({ data: { tasks: [] } })

    // Save tasks
    const tasks = plan.tasks.map(t => ({
      exam_id: input.data.exam_id,
      user_id: user.id,
      title: t.title,
      description: t.description,
      task_type: t.task_type,
      scheduled_date: t.scheduled_date,
      duration_minutes: t.duration_minutes,
      status: 'pending' as const,
    }))

    const { data: saved, error: saveErr } = await admin.from('study_tasks').insert(tasks).select()
    if (saveErr) throw saveErr

    await admin.from('ai_generations').insert({ user_id: user.id, feature: 'study_plan', model: 'llama-3.3-70b-versatile' })

    return NextResponse.json({ data: { tasks: saved, strategy: plan.strategy } })
  } catch (error) {
    console.error('Study plan error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

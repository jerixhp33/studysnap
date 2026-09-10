import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  let notifCount = 0

  try {
    // 1. Exam reminders (7 days before)
    const targetDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const { data: exams } = await admin.from('exams').select('id, user_id, name, exam_date').eq('exam_date', targetDate)
    for (const exam of exams ?? []) {
      await admin.from('notifications').insert({
        user_id: exam.user_id, type: 'exam_reminder', title: '⏰ Exam in 7 days!',
        message: `Your ${exam.name} exam is on ${exam.exam_date}. Make sure you're on track!`,
        metadata: { exam_id: exam.id },
      })
      notifCount++
    }

    // 2. Flashcards due
    const { data: flashcardUsers } = await admin.from('flashcards').select('user_id').lte('next_review', new Date().toISOString()).eq('user_id', (await admin.from('profiles').select('id')).data?.map(p => p.id) ?? [])
    const uniqueUsers = [...new Set(flashcardUsers?.map(f => f.user_id) ?? [])]
    for (const userId of uniqueUsers.slice(0, 100)) {
      const { count } = await admin.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', userId).lte('next_review', new Date().toISOString())
      if ((count ?? 0) > 0) {
        await admin.from('notifications').insert({
          user_id: userId, type: 'flashcards_due', title: '📚 Flashcards ready for review',
          message: `You have ${count} flashcards due for review today. Keep your streak going!`,
        })
        notifCount++
      }
    }

    // 3. Study reminders for users with pending tasks today
    const { data: pendingTasks } = await admin.from('study_tasks').select('user_id, count:id').eq('scheduled_date', today).eq('status', 'pending')
    const taskUsers = [...new Set(pendingTasks?.map(t => t.user_id) ?? [])]
    for (const userId of taskUsers.slice(0, 100)) {
      await admin.from('notifications').insert({
        user_id: userId, type: 'study_reminder', title: '📖 Study tasks waiting!',
        message: "Don't forget your study tasks for today. Small steps lead to big results!",
      })
      notifCount++
    }

    return NextResponse.json({ success: true, notifications_sent: notifCount })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}

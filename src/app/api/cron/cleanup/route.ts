import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  // Delete old read notifications (> 30 days)
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
  await admin.from('notifications').delete().eq('read', true).lt('created_at', cutoff)

  // Delete orphaned study tasks (> 60 days old, pending)
  const taskCutoff = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
  await admin.from('study_tasks').delete().eq('status', 'pending').lt('scheduled_date', taskCutoff)

  return NextResponse.json({ success: true })
}

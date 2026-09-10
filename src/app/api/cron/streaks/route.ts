import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Daily cron: update streaks for all users.
 * Schedule: 0 1 * * * (1am daily — after midnight, after most study days end)
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Find users who had at least one study session yesterday
  const { data: activeUsers } = await admin
    .from('study_sessions')
    .select('user_id')
    .gte('started_at', `${yesterday}T00:00:00Z`)
    .lt('started_at', `${new Date().toISOString().split('T')[0]}T00:00:00Z`)

  const activeSet = new Set(activeUsers?.map(u => u.user_id) ?? [])

  if (activeSet.size > 0) {
    // Increment streak for active users
    for (const userId of activeSet) {
      await admin.rpc('update_streak', { p_user_id: userId })
    }
  }

  // Reset streak for users who have one but were inactive yesterday
  // (only reset if they haven't studied for 2+ days to avoid timezone edge cases)
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()
  const { data: staleUsers } = await admin
    .from('profiles')
    .select('id')
    .gt('streak_days', 0)

  for (const u of staleUsers ?? []) {
    if (!activeSet.has(u.id)) {
      const { count } = await admin
        .from('study_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', u.id)
        .gte('started_at', twoDaysAgo)

      if ((count ?? 0) === 0) {
        await admin.from('profiles').update({ streak_days: 0 }).eq('id', u.id)
      }
    }
  }

  return NextResponse.json({
    success: true,
    active_users: activeSet.size,
  })
}

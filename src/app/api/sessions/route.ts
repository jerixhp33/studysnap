import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const startSchema = z.object({ subject_id: z.string().uuid().optional(), activity_type: z.enum(['study','quiz','flashcards','revision','rest']).default('study'), topic: z.string().optional() })
const endSchema = z.object({ session_id: z.string().uuid(), duration_seconds: z.number().min(0) })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()

  if (body.action === 'end') {
    const input = endSchema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    await admin.from('study_sessions').update({ ended_at: new Date().toISOString(), duration_seconds: input.data.duration_seconds }).eq('id', input.data.session_id).eq('user_id', user.id)
    // Update streak
    await admin.from('profiles').update({ streak_days: (await admin.from('profiles').select('streak_days').eq('id', user.id).single()).data?.streak_days ?? 0 }).eq('id', user.id)
    return NextResponse.json({ success: true })
  }

  const input = startSchema.safeParse(body)
  if (!input.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const { data } = await admin.from('study_sessions').insert({ user_id: user.id, ...input.data }).select().single()
  return NextResponse.json({ data })
}

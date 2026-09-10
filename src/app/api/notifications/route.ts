import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
  return NextResponse.json({ data: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, read_all } = await req.json()
  if (read_all) {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
  } else if (id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id)
  }
  return NextResponse.json({ success: true })
}

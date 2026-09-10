import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  document_id: z.string().uuid(),
  name: z.string().min(1).max(200),
})

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const input = schema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { error } = await supabase
      .from('documents')
      .update({ name: input.data.name.trim() })
      .eq('id', input.data.document_id)
      .eq('user_id', user.id) // RLS enforced server-side

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Rename failed' }, { status: 500 })
  }
}

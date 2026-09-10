import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ data: [] })

  try {
    const { data, error } = await supabase.rpc('global_search', {
      p_user_id: user.id,
      p_query: q,
      p_limit: 12,
    })

    if (error) {
      // Fallback: simple ILIKE search on documents
      const { data: docs } = await supabase
        .from('documents')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('status', 'ready')
        .ilike('name', `%${q}%`)
        .limit(8)

      return NextResponse.json({
        data: (docs ?? []).map(d => ({
          id: d.id, type: 'document', title: d.name, snippet: '', url: `/dashboard/notes/${d.id}`,
        })),
      })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch {
    return NextResponse.json({ data: [] })
  }
}

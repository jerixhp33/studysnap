import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const NEXT_REVIEW: Record<string, number> = { again: 0.0417, hard: 1, good: 3, easy: 7 }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { flashcard_id, confidence } = await req.json()
    if (!flashcard_id || !['again','hard','good','easy'].includes(confidence))
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const admin = createAdminClient()
    const nextReviewDays = NEXT_REVIEW[confidence] ?? 1
    const nextReview = new Date(Date.now() + nextReviewDays * 86400000).toISOString()
    const { data: current } = await admin.from('flashcards').select('review_count').eq('id', flashcard_id).eq('user_id', user.id).single()

    await admin.from('flashcards').update({
      confidence, last_reviewed: new Date().toISOString(),
      next_review: nextReview, review_count: (current?.review_count ?? 0) + 1,
    }).eq('id', flashcard_id).eq('user_id', user.id)

    await admin.from('flashcard_reviews').insert({ flashcard_id, user_id: user.id, confidence })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}

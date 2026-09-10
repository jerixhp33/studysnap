import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/ai'
import { flashcardInputSchema } from '@/schemas/ai'
import { checkUsageLimit, incrementUsage, usageLimitResponse } from '@/lib/usage'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const input = flashcardInputSchema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const usage = await checkUsageLimit(user.id, 'flashcard_generations_per_month')
    if (!usage.allowed) return usageLimitResponse(usage)

    const admin = createAdminClient()
    let content = ''
    let subjectName = ''

    if (input.data.document_id) {
      const { data: doc } = await admin.from('documents').select('extracted_text, name').eq('id', input.data.document_id).eq('user_id', user.id).single()
      if (!doc?.extracted_text) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      content = doc.extracted_text.slice(0, 12000)
      subjectName = doc.name
    } else if (input.data.subject_id) {
      const docIds = (await admin.from('documents').select('id').eq('subject_id', input.data.subject_id).eq('user_id', user.id)).data?.map(d => d.id) ?? []
      const { data: chunks } = await admin.from('document_chunks').select('content').eq('user_id', user.id).in('document_id', docIds).limit(20)
      content = chunks?.map(c => c.content).join('\n\n').slice(0, 12000) ?? ''
      const { data: sub } = await admin.from('subjects').select('name').eq('id', input.data.subject_id).single()
      subjectName = sub?.name ?? ''
    }

    if (!content.trim()) return NextResponse.json({ error: 'No study material found' }, { status: 422 })

    const ai = getAIProvider()
    const cards = await ai.generateFlashcards({
      content, cardCount: input.data.card_count,
      difficulty: input.data.difficulty, subject: subjectName, language: input.data.language,
    })

    const inserted = await Promise.all(cards.map(c =>
      admin.from('flashcards').insert({
        user_id: user.id, document_id: input.data.document_id ?? null,
        subject_id: input.data.subject_id ?? null, ...c,
        next_review: new Date().toISOString(),
      }).select().single().then(r => r.data)
    ))

    await incrementUsage(user.id, 'flashcard_generations_per_month')
    await incrementUsage(user.id, 'ai_generations_per_month')
    await admin.from('ai_generations').insert({ user_id: user.id, feature: 'flashcards', model: 'llama-3.3-70b-versatile' })

    return NextResponse.json({ data: inserted.filter(Boolean) })
  } catch (error) {
    console.error('Flashcard generation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 })
  }
}

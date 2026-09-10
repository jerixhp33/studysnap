import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/ai'
import { tutorInputSchema } from '@/schemas/ai'
import { retrieveRelevantContext, buildContext } from '@/lib/rag'
import { checkUsageLimit, incrementUsage, usageLimitResponse } from '@/lib/usage'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const input = tutorInputSchema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const usage = await checkUsageLimit(user.id, 'tutor_questions_per_day')
    if (!usage.allowed) return usageLimitResponse(usage)

    const admin = createAdminClient()

    // Get subject name
    let subjectName: string | undefined
    if (input.data.subject_id) {
      const { data: sub } = await admin.from('subjects').select('name').eq('id', input.data.subject_id).single()
      subjectName = sub?.name
    }

    // Get user profile for learning level
    const { data: profile } = await supabase.from('profiles').select('learning_level, preferred_language').eq('id', user.id).single()

    // RAG retrieval
    const relevantChunks = await retrieveRelevantContext(input.data.question, user.id, {
      documentId: input.data.document_id,
      subjectId: input.data.subject_id,
      limit: 4,
    })
    const context = buildContext(relevantChunks)

    // Get conversation history from conversation_id if provided
    const conversationHistory = body.conversation_history ?? []

    const ai = getAIProvider()
    const result = await ai.answerTutorQuestion({
      question: input.data.question,
      context,
      subject: subjectName,
      learningLevel: profile?.learning_level ?? input.data.learning_level,
      language: profile?.preferred_language ?? input.data.language,
      conversationHistory,
    })

    await incrementUsage(user.id, 'tutor_questions_per_day')
    await admin.from('ai_generations').insert({ user_id: user.id, feature: 'tutor', model: 'llama-3.3-70b-versatile' })

    return NextResponse.json({
      data: {
        answer: result.answer,
        source_referenced: result.source_referenced,
        context_used: relevantChunks.length > 0,
      }
    })
  } catch (error) {
    console.error('Tutor error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI tutor failed' }, { status: 500 })
  }
}

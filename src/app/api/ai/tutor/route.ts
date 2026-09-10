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

    let subjectName: string | undefined
    let contentFromDoc = ''

    if (input.data.document_id) {
      let { data: doc } = await supabase.from('documents').select('name, extracted_text').eq('id', input.data.document_id).eq('user_id', user.id).single()
      if (!doc) {
        try {
          const admin = createAdminClient()
          const { data: adminDoc } = await admin.from('documents').select('name, extracted_text').eq('id', input.data.document_id).single()
          doc = adminDoc
        } catch {}
      }
      if (doc) {
        subjectName = doc.name
        contentFromDoc = doc.extracted_text || doc.name
      }
    }

    if (!subjectName && input.data.subject_id) {
      const { data: sub } = await supabase.from('subjects').select('name').eq('id', input.data.subject_id).single()
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
    const ragContext = buildContext(relevantChunks)

    // Fallback to full document text if RAG chunks are empty
    const context = ragContext.trim()
      ? ragContext
      : (contentFromDoc ? `Document Name: ${subjectName}\n\nDocument Text:\n${contentFromDoc.slice(0, 10000)}` : '')

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
    await incrementUsage(user.id, 'ai_generations_per_month')

    return NextResponse.json({
      data: {
        answer: result.answer,
        source_referenced: result.source_referenced || context.length > 0,
        context_used: context.length > 0,
      }
    })
  } catch (error) {
    console.error('Tutor error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI tutor failed' }, { status: 500 })
  }
}

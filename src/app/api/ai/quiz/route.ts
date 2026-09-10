import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/ai'
import { quizInputSchema } from '@/schemas/ai'
import { checkUsageLimit, incrementUsage, usageLimitResponse } from '@/lib/usage'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const input = quizInputSchema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const usage = await checkUsageLimit(user.id, 'quiz_generations_per_month')
    if (!usage.allowed) return usageLimitResponse(usage)

    let db: any = supabase
    let content = ''
    let subjectName = ''

    if (input.data.document_id) {
      let { data: doc } = await supabase.from('documents').select('extracted_text, name, subjects:subjects(name)').eq('id', input.data.document_id).eq('user_id', user.id).single()
      if (!doc) {
        try {
          const admin = createAdminClient()
          const { data: adminDoc } = await admin.from('documents').select('extracted_text, name, subjects:subjects(name)').eq('id', input.data.document_id).eq('user_id', user.id).single()
          doc = adminDoc
          if (adminDoc) db = admin
        } catch {
          // fallback
        }
      }

      if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      content = (doc.extracted_text || doc.name || 'Study Material').slice(0, 12000)
      subjectName = doc.name
    } else if (input.data.subject_id) {
      const { data: chunks } = await supabase.from('document_chunks').select('content').eq('user_id', user.id)
        .in('document_id', (await supabase.from('documents').select('id').eq('subject_id', input.data.subject_id).eq('user_id', user.id)).data?.map(d => d.id) ?? [])
        .limit(20)
      content = chunks?.map(c => c.content).join('\n\n').slice(0, 12000) ?? ''
      const { data: sub } = await supabase.from('subjects').select('name').eq('id', input.data.subject_id).single()
      subjectName = sub?.name ?? ''
    }

    if (!content.trim()) return NextResponse.json({ error: 'No study material found' }, { status: 422 })

    const ai = getAIProvider()
    const questions = await ai.generateQuiz({
      content, questionCount: input.data.question_count,
      difficulty: input.data.difficulty, questionTypes: input.data.question_types,
      subject: subjectName, language: input.data.language,
    })

    // Save quiz + questions
    const { data: quiz, error: quizErr } = await db.from('quizzes').insert({
      user_id: user.id, document_id: input.data.document_id ?? null,
      subject_id: input.data.subject_id ?? null, title: `${subjectName} Quiz`,
      question_count: questions.length, difficulty: input.data.difficulty,
    }).select().single()
    if (quizErr) throw quizErr

    const savedQuestions = await Promise.all(questions.map(async (q, i) => {
      const { data: savedQ } = await db.from('questions').insert({
        user_id: user.id, document_id: input.data.document_id ?? null,
        subject_id: input.data.subject_id ?? null, ...q,
        options: q.options ? JSON.stringify(q.options) : null,
      }).select().single()
      if (savedQ) {
        await db.from('quiz_questions').insert({ quiz_id: quiz.id, question_id: savedQ.id, order_index: i })
      }
      return { ...q, id: savedQ?.id }
    }))

    await incrementUsage(user.id, 'quiz_generations_per_month')
    await incrementUsage(user.id, 'ai_generations_per_month')
    try { await db.from('ai_generations').insert({ user_id: user.id, feature: 'quiz', model: 'llama-3.3-70b-versatile' }) } catch {}

    return NextResponse.json({ data: { quiz, questions: savedQuestions } })
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 })
  }
}

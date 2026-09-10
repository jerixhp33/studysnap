import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/ai'
import { checkUsageLimit, incrementUsage, usageLimitResponse } from '@/lib/usage'
import { z } from 'zod'

export const maxDuration = 60

const inputSchema = z.object({
  question: z.string().min(3).max(1000),
  student_answer: z.string().min(1).max(5000),
  marks: z.union([z.literal(2), z.literal(5), z.literal(10)]),
  document_id: z.string().uuid().optional(),
  subject: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const input = inputSchema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const usage = await checkUsageLimit(user.id, 'ai_generations_per_month')
    if (!usage.allowed) return usageLimitResponse(usage)

    const admin = createAdminClient()
    let referenceContent = ''

    if (input.data.document_id) {
      const { data: doc } = await admin
        .from('documents')
        .select('extracted_text')
        .eq('id', input.data.document_id)
        .eq('user_id', user.id)
        .single()
      referenceContent = doc?.extracted_text?.slice(0, 4000) ?? ''
    }

    const ai = getAIProvider()
    const result = await ai.evaluateAnswer({
      question: input.data.question,
      studentAnswer: input.data.student_answer,
      referenceContent,
      marks: input.data.marks,
      subject: input.data.subject,
    })

    await incrementUsage(user.id, 'ai_generations_per_month')
    await admin.from('ai_generations').insert({ user_id: user.id, feature: 'evaluate', model: 'llama-3.3-70b-versatile' })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Evaluate error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Evaluation failed' }, { status: 500 })
  }
}

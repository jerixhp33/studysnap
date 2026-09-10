import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/ai'
import { summaryInputSchema } from '@/schemas/ai'
import { checkUsageLimit, incrementUsage, usageLimitResponse } from '@/lib/usage'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const input = summaryInputSchema.safeParse(body)
    if (!input.success) return NextResponse.json({ error: 'Invalid input', details: input.error.flatten() }, { status: 400 })

    // Check usage limits
    const usage = await checkUsageLimit(user.id, 'ai_generations_per_month')
    if (!usage.allowed) return usageLimitResponse(usage)

    let db: any = supabase

    // Verify document ownership and get text
    let { data: doc } = await supabase.from('documents')
      .select('id, extracted_text, name, status, user_id')
      .eq('id', input.data.document_id)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      try {
        const admin = createAdminClient()
        const { data: adminDoc } = await admin.from('documents').select('id, extracted_text, name, status, user_id').eq('id', input.data.document_id).eq('user_id', user.id).single()
        doc = adminDoc
        if (adminDoc) db = admin
      } catch {
        // fallback
      }
    }

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const textToSummarize = (doc.extracted_text || doc.name || 'Study Document').slice(0, 15000)

    // Check if summary already exists
    const { data: existing } = await supabase.from('summaries')
      .select('*').eq('document_id', input.data.document_id)
      .eq('summary_type', input.data.summary_type)
      .eq('language', input.data.language)
      .maybeSingle()

    if (existing) return NextResponse.json({ data: existing })

    // Generate summary
    const ai = getAIProvider()
    const result = await ai.generateSummary({
      content: textToSummarize,
      summaryType: input.data.summary_type,
      language: input.data.language,
      difficulty: input.data.difficulty,
      title: doc.name,
    })

    // Save to DB
    const { data: saved, error: saveErr } = await db.from('summaries').insert({
      document_id: input.data.document_id,
      user_id: user.id,
      summary_type: input.data.summary_type,
      language: input.data.language,
      difficulty: input.data.difficulty,
      ...result,
    }).select().single()

    if (saveErr) throw saveErr

    // Log usage
    await incrementUsage(user.id, 'ai_generations_per_month')
    try { await db.from('ai_generations').insert({ user_id: user.id, feature: 'summary', model: 'llama-3.3-70b-versatile' }) } catch {}

    return NextResponse.json({ data: saved })
  } catch (error) {
    console.error('Summary generation error:', error)
    const msg = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

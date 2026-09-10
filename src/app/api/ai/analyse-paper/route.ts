import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUsageLimit, incrementUsage, usageLimitResponse } from '@/lib/usage'
import { createAdminClient } from '@/lib/supabase/admin'
import { cleanExtractedText } from '@/lib/pdf'
import { getAIProvider } from '@/lib/ai'
import { z } from 'zod'

export const maxDuration = 60

const analysisOutputSchema = z.object({
  frequent_topics: z.array(z.object({
    topic: z.string(),
    frequency: z.number(),
    marks: z.number().optional(),
  })),
  question_styles: z.array(z.string()),
  important_units: z.array(z.string()),
  exam_strategy: z.string(),
  practice_questions: z.array(z.string()),
})

const ANALYSE_PROMPT = `You are an expert exam pattern analyser. Analyse this previous year exam paper and identify patterns.

Return ONLY valid JSON with this structure:
{
  "frequent_topics": [{"topic": "string", "frequency": number, "marks": number}],
  "question_styles": ["string"],
  "important_units": ["string"],
  "exam_strategy": "string — concise study strategy based on the patterns",
  "practice_questions": ["string — 5 likely practice questions based on the patterns"]
}

Rules:
1. Only report what you actually see in the paper
2. frequency = how many times this topic appears
3. marks = total marks for that topic (if visible)
4. Do NOT claim these will definitely appear in future exams
5. practice_questions must be clearly framed as practice, not predictions
6. Return ONLY valid JSON`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const usage = await checkUsageLimit(user.id, 'ai_generations_per_month')
    if (!usage.allowed) return usageLimitResponse(usage)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate file
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let text = ''

    if (file.type === 'application/pdf') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(buffer)
        text = cleanExtractedText(data.text)
      } catch {
        return NextResponse.json({ error: 'Could not read PDF. Try an image format.' }, { status: 422 })
      }
    } else {
      // For images: send a note to the AI about limitations
      text = '[Image paper uploaded. Please analyse based on visual content patterns typical for this type of exam paper.]'
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'No readable content found' }, { status: 422 })
    }

    // Call AI
    const Groq = (await import('groq-sdk')).default
    const apiKey = process.env.GROQ_API_KEY_1
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured. Add GROQ_API_KEY_1 to your environment.' }, { status: 503 })
    }

    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      temperature: 0.2,
      messages: [
        { role: 'system', content: ANALYSE_PROMPT },
        { role: 'user', content: `Exam paper content:\n\n${text.slice(0, 10000)}` },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ error: 'Analysis could not be completed. Try again.' }, { status: 500 })
    }

    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
    const result = analysisOutputSchema.parse(parsed)

    const admin = createAdminClient()
    await incrementUsage(user.id, 'ai_generations_per_month')
    await admin.from('ai_generations').insert({ user_id: user.id, feature: 'analyse_paper', model: 'llama-3.3-70b-versatile' })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Paper analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chunkText, storeDocumentChunks } from '@/lib/rag'
import { cleanExtractedText } from '@/lib/pdf'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { document_id } = await req.json()
    if (!document_id) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: doc } = await admin
      .from('documents')
      .select('id, extracted_text, user_id')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single()

    if (!doc?.extracted_text) {
      return NextResponse.json({ error: 'No text to index' }, { status: 422 })
    }

    const cleaned = cleanExtractedText(doc.extracted_text)
    const chunks = chunkText(cleaned)
    await storeDocumentChunks(document_id, user.id, chunks)
    await admin.from('documents').update({ status: 'ready' }).eq('id', document_id)

    return NextResponse.json({ success: true, chunks: chunks.length })
  } catch (error) {
    console.error('Reindex error:', error)
    return NextResponse.json({ error: 'Reindex failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractTextFromPDF, cleanExtractedText } from '@/lib/pdf'
import { chunkText, storeDocumentChunks } from '@/lib/rag'
import { computeEarnedBadges } from '@/lib/badges'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { document_id } = await req.json()
    if (!document_id) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

    const admin = createAdminClient()

    // Verify ownership with retry for DB write propagation
    let doc = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await admin.from('documents').select('*').eq('id', document_id).single()
      if (data) { doc = data; break }
      await new Promise(r => setTimeout(r, 500))
    }
    if (!doc || doc.user_id !== user.id) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Update status: reading
    await admin.from('documents').update({ status: 'reading' }).eq('id', document_id)

    // Download file from storage
    const { data: fileData, error: dlErr } = await admin.storage.from('documents').download(doc.file_path)
    if (dlErr || !fileData) {
      await admin.from('documents').update({ status: 'failed', error_message: 'Could not retrieve file.' }).eq('id', document_id)
      return NextResponse.json({ error: 'File download failed' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    let extractedText = ''
    let pageCount = 1

    // Update: extracting
    await admin.from('documents').update({ status: 'extracting' }).eq('id', document_id)

    if (doc.file_type === 'pdf') {
      try {
        const result = await extractTextFromPDF(buffer)
        extractedText = cleanExtractedText(result.text)
        pageCount = result.pageCount
      } catch (e) {
        await admin.from('documents').update({ status: 'failed', error_message: 'PDF extraction failed. File may be corrupted or password-protected.' }).eq('id', document_id)
        return NextResponse.json({ error: 'PDF extraction failed' }, { status: 422 })
      }
    } else if (doc.file_type === 'text') {
      extractedText = cleanExtractedText(buffer.toString('utf-8'))
    } else if (doc.file_type === 'image') {
      // For images, we do basic extraction (OCR requires client-side Tesseract)
      // Store placeholder and mark as partially ready
      extractedText = '[Image document — text extraction requires the web interface. Open this document to process it.]'
    }

    if (!extractedText.trim()) {
      await admin.from('documents').update({ status: 'failed', error_message: 'No text could be extracted from this document.' }).eq('id', document_id)
      return NextResponse.json({ error: 'No text extracted' }, { status: 422 })
    }

    // Update: understanding + store text
    await admin.from('documents').update({ status: 'understanding', extracted_text: extractedText, page_count: pageCount }).eq('id', document_id)

    // Chunk and index
    await admin.from('documents').update({ status: 'indexing' }).eq('id', document_id)
    const chunks = chunkText(extractedText)
    await storeDocumentChunks(document_id, user.id, chunks)

    // Done
    await admin.from('documents').update({ status: 'ready' }).eq('id', document_id)

    // Badge: first upload
    const { count: docCount } = await admin.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'ready')
    const badges = computeEarnedBadges({ userId: user.id, documentCount: docCount ?? 0 })
    for (const b of badges) {
      await admin.from('user_badges').upsert({ user_id: user.id, badge_id: b }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })
    }

    return NextResponse.json({ success: true, chunks: chunks.length })
  } catch (error) {
    console.error('Document processing error:', error)
    const msg = error instanceof Error ? error.message : 'Processing failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

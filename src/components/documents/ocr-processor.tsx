'use client'
/**
 * Client-side OCR for image documents using Tesseract.js.
 * Only loaded when the user opens an image document that lacks extracted text.
 * Tesseract is large (~10MB) — lazy-loaded via dynamic import.
 */
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Scan, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  documentId: string
  filePath: string
  onComplete: (text: string) => void
}

export function OCRProcessor({ documentId, filePath, onComplete }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const supabase = createClient()
  const { toast } = useToast()

  async function runOCR() {
    setStatus('loading')
    setError('')
    setProgress(0)

    try {
      // 1. Get a signed URL for the image
      const { data: signedData, error: signErr } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(filePath, 60)

      if (signErr || !signedData?.signedUrl) {
        throw new Error('Could not access image file')
      }

      setStatus('processing')

      // 2. Lazy-load Tesseract (not bundled until needed)
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round((m.progress ?? 0) * 100))
          }
        },
      })

      // 3. Recognise text
      const { data } = await worker.recognize(signedData.signedUrl)
      await worker.terminate()

      const extractedText = data.text.trim()
      if (!extractedText || extractedText.length < 20) {
        throw new Error('No readable text found in the image. Try a clearer photo.')
      }

      // 4. Save text + trigger re-processing (chunking + embedding)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('documents')
        .update({ extracted_text: extractedText, status: 'indexing' })
        .eq('id', documentId)
        .eq('user_id', user.id)

      // 5. Re-trigger server-side chunking
      await fetch('/api/documents/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      })

      setStatus('done')
      onComplete(extractedText)
      toast({ type: 'success', title: 'Text extracted!' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OCR failed'
      setError(msg)
      setStatus('error')
      toast({ type: 'error', title: 'OCR failed', description: msg })
    }
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-bg)] px-4 py-2 rounded-xl">
        <CheckCircle className="h-4 w-4" />
        Text extracted successfully!
      </div>
    )
  }

  return (
    <div className="bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Scan className="h-5 w-5 text-[var(--warning)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Image needs text extraction</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Click below to run OCR and extract text from this image. Results may vary based on image quality.
          </p>
        </div>
      </div>

      {status === 'processing' && (
        <div>
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
            <span>Recognising text…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--warning)] rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-[var(--error)] bg-[var(--error-bg)] px-3 py-2 rounded-lg">{error}</p>
      )}

      {(status === 'idle' || status === 'error') && (
        <button
          onClick={runOCR}
          className="inline-flex items-center gap-2 bg-[var(--warning)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Scan className="h-4 w-4" />
          {status === 'error' ? 'Retry OCR' : 'Extract Text'}
        </button>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading OCR engine…
        </div>
      )}
    </div>
  )
}

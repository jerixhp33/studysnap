'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface UploadDialogProps {
  subjects: { id: string; name: string; color: string }[]
  autoOpen?: boolean
  triggerLabel?: string
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']
const ALLOWED_EXT = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt']
const MAX_SIZE = 30 * 1024 * 1024 // 30MB

function getFileIcon(type: string) {
  if (type === 'application/pdf') return <FileText className="h-5 w-5 text-[var(--error)]" />
  if (type.startsWith('image/')) return <Image className="h-5 w-5 text-[var(--info)]" />
  return <File className="h-5 w-5 text-[var(--muted-foreground)]" />
}

type UploadStatus = 'idle' | 'uploading' | 'reading' | 'extracting' | 'understanding' | 'indexing' | 'done' | 'error'

const STATUS_MESSAGES: Record<UploadStatus, string> = {
  idle: '', uploading: 'Uploading your file...', reading: 'Reading the document...',
  extracting: 'Extracting text...', understanding: 'Understanding the content...',
  indexing: 'Creating search index...', done: 'Ready! ✨', error: 'Something went wrong.',
}

export function UploadDocumentDialog({ subjects, autoOpen = false, triggerLabel = 'Upload Notes' }: UploadDialogProps) {
  const [open, setOpen] = useState(autoOpen)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  function validateFile(f: File): string | null {
    if (!ALLOWED_TYPES.includes(f.type)) return `Unsupported file type. Use: ${ALLOWED_EXT.join(', ')}`
    if (f.size > MAX_SIZE) return `File too large. Maximum is 30MB.`
    return null
  }

  function selectFile(f: File) {
    const err = validateFile(f)
    if (err) { setError(err); return }
    setFile(f); setName(f.name.replace(/\.[^.]+$/, '')); setError('')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) selectFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) selectFile(f)
  }, [])

  function close() { setOpen(false); setFile(null); setName(''); setSubjectId(''); setStatus('idle'); setError('') }

  async function handleUpload() {
    if (!file || !name.trim()) return
    setStatus('uploading'); setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Upload to storage
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type })
      if (upErr) throw upErr

      // 2. Create DB record
      const fileType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'text'
      const { data: doc, error: dbErr } = await supabase.from('documents').insert({
        user_id: user.id, name: name.trim(), file_path: path, file_type: fileType,
        file_size: file.size, status: 'reading', subject_id: subjectId || null,
      }).select().single()
      if (dbErr) throw dbErr

      setStatus('reading')

      // 3. Trigger processing
      const res = await fetch('/api/documents/process', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: doc.id }),
      })

      if (!res.ok) {
        const { error: procErr } = await res.json()
        throw new Error(procErr ?? 'Processing failed')
      }

      // Poll status
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const { data } = await supabase.from('documents').select('status').eq('id', doc.id).single()
        const s = (data?.status ?? "") as UploadStatus
        if (s) setStatus(s as UploadStatus)
        if ((s as string) === "ready") { clearInterval(poll); setStatus('done'); setTimeout(() => { close(); router.refresh() }, 1500) }
        if ((s as string) === 'failed' || attempts > 60) { clearInterval(poll); setStatus('error'); setError('Processing failed. Please retry.') }
      }, 2000)

    } catch (e: any) {
      console.error('Upload error:', e)
      const msg = e?.message || e?.error_description || (typeof e === 'string' ? e : 'Upload failed')
      setError(msg); setStatus('error')
      toast({ type: 'error', title: 'Upload failed', description: msg })
    }
  }

  const isProcessing = !['idle', 'done', 'error'].includes(status)

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[var(--primary-dark)] transition-colors">
        <Upload className="h-4 w-4" />{triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={!isProcessing ? close : undefined} />
          <div className="relative bg-[var(--card)] rounded-t-2xl sm:rounded-2xl border border-[var(--border)] w-full sm:max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Upload Notes</h2>
              {!isProcessing && <button onClick={close} className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors"><X className="h-5 w-5" /></button>}
            </div>

            {status === 'done' ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✨</div>
                <p className="font-semibold text-[var(--foreground)]">Notes ready!</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">Opening your document...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Drop zone */}
                {!file ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]'}`}
                  >
                    <Upload className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[var(--foreground)]">Drop file here or click to browse</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">PDF, PNG, JPG, WEBP, TXT · Max 30MB</p>
                    <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFileChange} className="hidden" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-[var(--muted)] rounded-xl p-3">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{file.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {!isProcessing && <button onClick={() => { setFile(null); setName('') }} className="text-[var(--muted-foreground)] hover:text-[var(--error)] transition-colors"><X className="h-4 w-4" /></button>}
                  </div>
                )}

                {file && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Document name</label>
                      <input value={name} onChange={e => setName(e.target.value)} disabled={isProcessing}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-60" />
                    </div>
                    {subjects.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Subject (optional)</label>
                        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={isProcessing}
                          className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-60">
                          <option value="">No subject</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {isProcessing && (
                  <div className="bg-[var(--muted)] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="animate-spin h-5 w-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      <p className="text-sm font-medium text-[var(--foreground)]">{STATUS_MESSAGES[status]}</p>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">You can leave this page — we'll process it in the background.</p>
                  </div>
                )}

                {error && <p className="text-sm text-[var(--error)] bg-[var(--error-bg)] px-3 py-2 rounded-lg">{error}</p>}

                {!isProcessing && file && (
                  <div className="flex gap-3">
                    <button onClick={close} className="flex-1 h-11 border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--muted)] transition-colors">Cancel</button>
                    <button onClick={handleUpload} disabled={!name.trim()} className="flex-1 h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60">
                      Upload & Process
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

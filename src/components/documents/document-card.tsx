'use client'
import Link from 'next/link'
import { FileText, Image, File, MoreVertical, Trash2, Sparkles, HelpCircle, Zap, Pencil, Check, X } from 'lucide-react'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatFileSize } from '@/lib/utils'

interface DocCardProps {
  doc: {
    id: string; name: string; file_type: string; file_size: number
    page_count?: number | null; status: string; error_message?: string | null
    created_at: string; subjects?: { name: string; color: string } | null
  }
}

const STATUS_CONFIG = {
  uploading:    { label: 'Uploading',    color: 'bg-[var(--info-bg)] text-[var(--info)]'       },
  reading:      { label: 'Reading',      color: 'bg-[var(--warning-bg)] text-[var(--warning)]' },
  extracting:   { label: 'Extracting',   color: 'bg-[var(--warning-bg)] text-[var(--warning)]' },
  understanding:{ label: 'Understanding',color: 'bg-[var(--warning-bg)] text-[var(--warning)]' },
  indexing:     { label: 'Indexing',     color: 'bg-[var(--warning-bg)] text-[var(--warning)]' },
  ready:        { label: 'Ready',        color: 'bg-[var(--success-bg)] text-[var(--success)]' },
  failed:       { label: 'Failed',       color: 'bg-[var(--error-bg)] text-[var(--error)]'     },
} as const

export function DocumentCard({ doc }: DocCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(doc.name)
  const [displayName, setDisplayName] = useState(doc.name)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const status = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.uploading
  const isReady = doc.status === 'ready'

  async function handleDelete() {
    if (!confirm('Delete this document? This cannot be undone.')) return
    setDeleting(true)
    setMenuOpen(false)
    const { data: docData } = await supabase.from('documents').select('file_path').eq('id', doc.id).single()
    if (docData?.file_path) {
      await supabase.storage.from('documents').remove([docData.file_path])
    }
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) {
      toast({ type: 'error', title: 'Delete failed', description: error.message })
      setDeleting(false)
    } else {
      toast({ type: 'success', title: 'Document deleted' })
      router.refresh()
    }
  }

  function startEdit() {
    setMenuOpen(false)
    setEditName(displayName)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 50)
  }

  async function saveEdit() {
    if (!editName.trim() || editName.trim() === displayName) { setEditing(false); return }
    const res = await fetch('/api/documents/rename', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: doc.id, name: editName.trim() }),
    })
    if (res.ok) {
      setDisplayName(editName.trim())
      toast({ type: 'success', title: 'Renamed' })
    } else {
      toast({ type: 'error', title: 'Rename failed' })
    }
    setEditing(false)
  }

  const FileIcon = doc.file_type === 'pdf'
    ? <FileText className="h-5 w-5 text-[var(--error)]" />
    : doc.file_type === 'image'
    ? <Image className="h-5 w-5 text-[var(--info)]" />
    : <File className="h-5 w-5 text-[var(--muted-foreground)]" />

  return (
    <div className={`relative bg-[var(--card)] rounded-xl border transition-all group ${deleting ? 'opacity-50 pointer-events-none' : 'border-[var(--border)] hover:shadow-sm'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 bg-[var(--muted)] rounded-lg shrink-0">{FileIcon}</div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
                  className="flex-1 min-w-0 h-7 px-2 text-sm rounded border border-[var(--primary)] bg-[var(--background)] focus-visible:outline-none"
                />
                <button onClick={saveEdit} className="text-[var(--success)] hover:opacity-80"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditing(false)} className="text-[var(--muted-foreground)] hover:opacity-80"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <p className="font-medium text-sm text-[var(--foreground)] truncate">{displayName}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
              {doc.subjects && <span className="text-xs text-[var(--muted-foreground)] truncate">{doc.subjects.name}</span>}
            </div>
          </div>
        </div>

        {!isReady && doc.status !== 'failed' && (
          <div className="h-1 bg-[var(--muted)] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-[var(--primary)] rounded-full animate-pulse w-2/3" />
          </div>
        )}
        {doc.status === 'failed' && (
          <p className="text-xs text-[var(--error)] bg-[var(--error-bg)] px-2 py-1 rounded-lg mb-3">
            {doc.error_message ?? 'Processing failed'}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>{formatFileSize(doc.file_size)}{doc.page_count ? ` · ${doc.page_count}p` : ''}</span>
          <span>{formatDate(doc.created_at)}</span>
        </div>
      </div>

      {/* Quick actions — only when ready */}
      {isReady && (
        <div className="px-4 pb-3 flex gap-1.5">
          <Link href={`/dashboard/notes/${doc.id}?tab=summary`}
            className="flex-1 flex items-center justify-center gap-1 h-8 text-xs font-medium bg-[var(--muted)] rounded-lg hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />Summary
          </Link>
          <Link href={`/dashboard/quizzes?doc=${doc.id}`}
            className="flex-1 flex items-center justify-center gap-1 h-8 text-xs font-medium bg-[var(--muted)] rounded-lg hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-colors">
            <HelpCircle className="h-3.5 w-3.5" />Quiz
          </Link>
          <Link href={`/dashboard/flashcards?doc=${doc.id}`}
            className="flex-1 flex items-center justify-center gap-1 h-8 text-xs font-medium bg-[var(--muted)] rounded-lg hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-colors">
            <Zap className="h-3.5 w-3.5" />Cards
          </Link>
        </div>
      )}

      {/* 3-dot menu */}
      <div className="absolute top-3 right-3">
        <button
          onClick={e => { e.preventDefault(); setMenuOpen(!menuOpen) }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--muted)] transition-all"
          aria-label="Document options"
        >
          <MoreVertical className="h-4 w-4 text-[var(--muted-foreground)]" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-20 py-1 w-36">
              <button onClick={startEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                <Pencil className="h-4 w-4" />Rename
              </button>
              {isReady && (
                <Link href={`/dashboard/notes/${doc.id}`} onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                  <FileText className="h-4 w-4" />Open
                </Link>
              )}
              <button onClick={handleDelete} disabled={deleting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors">
                <Trash2 className="h-4 w-4" />{deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

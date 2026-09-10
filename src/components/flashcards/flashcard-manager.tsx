'use client'
import { useState } from 'react'
import { Trash2, Search, Filter, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface Flashcard {
  id: string; front: string; back: string; topic: string | null
  difficulty: string; confidence: string | null; review_count: number
  next_review: string | null; subject_id: string | null
}

interface Props {
  flashcards: Flashcard[]
  subjects: { id: string; name: string; color: string }[]
}

const CONFIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  again: { label: 'Again', color: 'bg-[var(--error-bg)] text-[var(--error)]' },
  hard:  { label: 'Hard',  color: 'bg-[var(--warning-bg)] text-[var(--warning)]' },
  good:  { label: 'Good',  color: 'bg-[var(--info-bg)] text-[var(--info)]' },
  easy:  { label: 'Easy',  color: 'bg-[var(--success-bg)] text-[var(--success)]' },
}

export function FlashcardManager({ flashcards: initial, subjects }: Props) {
  const [flashcards, setFlashcards] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterConf, setFilterConf] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const filtered = flashcards.filter(f => {
    if (search && !f.front.toLowerCase().includes(search.toLowerCase()) && !f.back.toLowerCase().includes(search.toLowerCase())) return false
    if (filterSubject && f.subject_id !== filterSubject) return false
    if (filterConf === 'due') return !f.next_review || new Date(f.next_review) <= new Date()
    if (filterConf && f.confidence !== filterConf) return false
    return true
  })

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(f => f.id)))
    }
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} flashcard${selected.size !== 1 ? 's' : ''}?`)) return
    setDeleting(true)
    const ids = Array.from(selected)
    const { error } = await supabase.from('flashcards').delete().in('id', ids)
    if (error) {
      toast({ type: 'error', title: 'Delete failed', description: error.message })
    } else {
      setFlashcards(prev => prev.filter(f => !selected.has(f.id)))
      setSelected(new Set())
      toast({ type: 'success', title: `${ids.length} flashcard${ids.length !== 1 ? 's' : ''} deleted` })
    }
    setDeleting(false)
  }

  async function resetSelected() {
    const ids = Array.from(selected)
    await supabase.from('flashcards').update({ confidence: null, next_review: new Date().toISOString(), review_count: 0 }).in('id', ids)
    setFlashcards(prev => prev.map(f => selected.has(f.id) ? { ...f, confidence: null, next_review: new Date().toISOString(), review_count: 0 } : f))
    setSelected(new Set())
    toast({ type: 'success', title: `${ids.length} card${ids.length !== 1 ? 's' : ''} reset` })
  }

  const isDue = (f: Flashcard) => !f.next_review || new Date(f.next_review) <= new Date()

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" />
        </div>
        {subjects.length > 0 && (
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus-visible:outline-none">
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select value={filterConf} onChange={e => setFilterConf(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus-visible:outline-none">
          <option value="">All cards</option>
          <option value="due">Due now</option>
          <option value="again">Again</option>
          <option value="hard">Hard</option>
          <option value="good">Good</option>
          <option value="easy">Easy</option>
        </select>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium text-[var(--primary)]">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={resetSelected}
              className="text-xs font-medium text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
              Reset progress
            </button>
            <button onClick={deleteSelected} disabled={deleting}
              className="text-xs font-medium text-white bg-[var(--error)] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-3 px-3 text-xs font-medium text-[var(--muted-foreground)]">
        <input type="checkbox"
          checked={filtered.length > 0 && selected.size === filtered.length}
          onChange={toggleAll}
          className="rounded border-[var(--border)] w-4 h-4 shrink-0"
        />
        <span className="flex-1">Front</span>
        <span className="w-16 text-right hidden sm:block">Reviews</span>
        <span className="w-16 text-right">Status</span>
      </div>

      {/* Card list */}
      <div className="space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No flashcards match your filters</p>
          </div>
        )}
        {filtered.map(f => (
          <div key={f.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
              selected.has(f.id) ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20' : 'border-[var(--border)] hover:bg-[var(--muted)]'
            }`}>
            <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleSelect(f.id)}
              className="rounded border-[var(--border)] w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">{f.front}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{f.back}</p>
            </div>
            <span className="text-xs text-[var(--muted-foreground)] w-16 text-right hidden sm:block shrink-0">
              {f.review_count}×
            </span>
            <div className="w-16 flex justify-end shrink-0">
              {isDue(f) ? (
                <span className="text-[10px] font-semibold bg-[var(--error-bg)] text-[var(--error)] px-1.5 py-0.5 rounded-full">Due</span>
              ) : f.confidence ? (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CONFIDENCE_LABELS[f.confidence]?.color ?? ''}`}>
                  {CONFIDENCE_LABELS[f.confidence]?.label}
                </span>
              ) : (
                <span className="text-[10px] text-[var(--muted-foreground)]">New</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--muted-foreground)] text-center">
        Showing {filtered.length} of {flashcards.length} flashcards
      </p>
    </div>
  )
}

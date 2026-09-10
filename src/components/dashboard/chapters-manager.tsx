'use client'
import { useState } from 'react'
import { Plus, GripVertical, Trash2, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface Chapter { id: string; name: string; order_index: number }
interface Props { chapters: Chapter[]; subjectId: string }

export function ChaptersManager({ chapters: initial, subjectId }: Props) {
  const [chapters, setChapters] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function addChapter() {
    if (!newName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        subject_id: subjectId,
        user_id: user.id,
        name: newName.trim(),
        order_index: chapters.length,
      })
      .select()
      .single()

    if (error) {
      toast({ type: 'error', title: 'Error', description: error.message })
    } else {
      setChapters(prev => [...prev, data as Chapter])
      setNewName('')
      setAdding(false)
      toast({ type: 'success', title: 'Chapter added' })
    }
    setSaving(false)
  }

  async function deleteChapter(id: string) {
    if (!confirm('Delete this chapter?')) return
    const { error } = await supabase.from('chapters').delete().eq('id', id)
    if (error) {
      toast({ type: 'error', title: 'Error', description: error.message })
    } else {
      setChapters(prev => prev.filter(c => c.id !== id))
      toast({ type: 'success', title: 'Chapter deleted' })
    }
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    const { error } = await supabase.from('chapters').update({ name: editName.trim() }).eq('id', id)
    if (error) {
      toast({ type: 'error', title: 'Error', description: error.message })
    } else {
      setChapters(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c))
      setEditId(null)
    }
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[var(--foreground)]">Chapters ({chapters.length})</h2>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {chapters.length === 0 && !adding && (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
          No chapters yet. Add chapters to organise your notes.
        </p>
      )}

      <div className="space-y-2">
        {chapters.map((ch, idx) => (
          <div key={ch.id} className="flex items-center gap-2 group">
            <GripVertical className="h-4 w-4 text-[var(--muted-foreground)] opacity-40 shrink-0" aria-hidden />
            <span className="text-xs text-[var(--muted-foreground)] w-5 shrink-0">{idx + 1}</span>

            {editId === ch.id ? (
              <div className="flex-1 flex gap-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(ch.id)}
                  className="flex-1 h-8 px-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  autoFocus
                />
                <button onClick={() => saveEdit(ch.id)} className="text-[var(--success)]"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditId(null)} className="text-[var(--muted-foreground)]"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setEditId(ch.id); setEditName(ch.name) }}
                  className="flex-1 text-left text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors py-1"
                >
                  {ch.name}
                </button>
                <button
                  onClick={() => deleteChapter(ch.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--error)] transition-all"
                  aria-label={`Delete chapter ${ch.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex gap-2 mt-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addChapter()}
              placeholder="Chapter name..."
              autoFocus
              className="flex-1 h-9 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            />
            <button
              onClick={addChapter}
              disabled={saving || !newName.trim()}
              className="px-3 h-9 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60"
            >
              {saving ? '...' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setNewName('') }}
              className="px-3 h-9 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

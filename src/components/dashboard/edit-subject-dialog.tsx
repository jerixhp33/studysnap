'use client'
import { useState } from 'react'
import { Pencil, X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']

interface Props {
  subject: { id: string; name: string; description: string | null; color: string; semester: string | null }
  onClose?: () => void
}

export function EditSubjectDialog({ subject, onClose }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(subject.name)
  const [description, setDescription] = useState(subject.description ?? '')
  const [semester, setSemester] = useState(subject.semester ?? '')
  const [color, setColor] = useState(subject.color)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  function close() { setOpen(false); onClose?.() }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('subjects')
      .update({ name: name.trim(), description: description.trim() || null, semester: semester.trim() || null, color })
      .eq('id', subject.id)
    if (error) {
      toast({ type: 'error', title: 'Save failed', description: error.message })
    } else {
      toast({ type: 'success', title: 'Subject updated!' })
      close()
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${subject.name}"? All notes, quizzes and flashcards will be removed.`)) return
    setDeleting(true)
    const { error } = await supabase.from('subjects').delete().eq('id', subject.id)
    if (error) {
      toast({ type: 'error', title: 'Delete failed', description: error.message })
      setDeleting(false)
    } else {
      toast({ type: 'success', title: 'Subject deleted' })
      router.push('/dashboard/subjects')
    }
  }

  async function handleArchive() {
    await supabase.from('subjects').update({ archived: true }).eq('id', subject.id)
    toast({ type: 'success', title: 'Subject archived' })
    router.push('/dashboard/subjects')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <Pencil className="h-4 w-4" /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-[var(--card)] rounded-t-2xl sm:rounded-2xl border border-[var(--border)] w-full sm:max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Subject</h2>
              <button onClick={close} className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors">
                <X className="h-5 w-5 text-[var(--muted-foreground)]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Subject name *</label>
                <input
                  required value={name} onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Semester / Class</label>
                <input
                  value={semester} onChange={e => setSemester(e.target.value)}
                  placeholder="e.g. Semester 6"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Description</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-[var(--foreground)] scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={close}
                  className="flex-1 h-11 border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !name.trim()}
                  className="flex-1 h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-[var(--border)] flex gap-2">
              <button onClick={handleArchive}
                className="flex-1 h-9 text-sm text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                Archive
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 h-9 text-sm text-[var(--error)] border border-[var(--error)]/30 rounded-lg hover:bg-[var(--error-bg)] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

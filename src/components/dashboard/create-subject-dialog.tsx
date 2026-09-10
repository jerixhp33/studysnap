'use client'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']

export function CreateSubjectDialog({ triggerLabel = 'New Subject' }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [semester, setSemester] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('subjects').insert({ user_id: user.id, name: name.trim(), description: description.trim() || null, semester: semester.trim() || null, color })
    if (error) { toast({ type: 'error', title: 'Error', description: error.message }); setLoading(false); return }
    toast({ type: 'success', title: 'Subject created!' })
    setOpen(false); setName(''); setDescription(''); setSemester(''); setColor(COLORS[0])
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[var(--primary-dark)] transition-colors">
        <Plus className="h-4 w-4" />{triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-[var(--card)] rounded-t-2xl sm:rounded-2xl border border-[var(--border)] w-full sm:max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">New Subject</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Subject name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Database Management Systems"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Semester / Class</label>
                <input value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. Semester 6"
                  className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none" />
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
                <button type="button" onClick={() => setOpen(false)} className="flex-1 h-11 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">Cancel</button>
                <button type="submit" disabled={loading || !name.trim()} className="flex-1 h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60">
                  {loading ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

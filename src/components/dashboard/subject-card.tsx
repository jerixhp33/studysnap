'use client'
import Link from 'next/link'
import { FileText, BookOpen, MoreVertical, Trash2, Archive } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface SubjectCardProps {
  subject: {
    id: string; name: string; description?: string | null; color: string
    semester?: string | null; chapters?: [{ count: number }]; documents?: [{ count: number }]
  }
}

export function SubjectCard({ subject }: SubjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm(`Delete "${subject.name}"? This will also delete all associated notes, quizzes and flashcards.`)) return
    setDeleting(true)
    const { error } = await supabase.from('subjects').delete().eq('id', subject.id)
    if (error) { toast({ type: 'error', title: 'Error', description: error.message }); setDeleting(false) }
    else { toast({ type: 'success', title: 'Subject deleted' }); router.refresh() }
  }

  async function handleArchive() {
    await supabase.from('subjects').update({ archived: true }).eq('id', subject.id)
    router.refresh()
  }

  const chapters = (subject.chapters as unknown as Array<{count: number}>)?.[0]?.count ?? 0
  const docs = (subject.documents as unknown as Array<{count: number}>)?.[0]?.count ?? 0

  return (
    <div className="relative bg-[var(--card)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all hover:shadow-sm group">
      <Link href={`/dashboard/subjects/${subject.id}`} className="block p-5">
        {/* Color accent */}
        <div className="h-1.5 w-12 rounded-full mb-4" style={{ backgroundColor: subject.color }} />
        {subject.semester && (
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full mb-2 inline-block">{subject.semester}</span>
        )}
        <h3 className="font-semibold text-[var(--foreground)] text-base mb-1 truncate">{subject.name}</h3>
        {subject.description && (
          <p className="text-sm text-[var(--muted-foreground)] truncate mb-3">{subject.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{chapters} chapters</span>
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{docs} notes</span>
        </div>
      </Link>

      {/* Menu */}
      <div className="absolute top-3 right-3">
        <button onClick={e => { e.preventDefault(); setMenuOpen(!menuOpen) }} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--muted)] transition-all">
          <MoreVertical className="h-4 w-4 text-[var(--muted-foreground)]" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-10 py-1 w-40">
            <button onClick={handleArchive} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
              <Archive className="h-4 w-4" />Archive
            </button>
            <button onClick={handleDelete} disabled={deleting} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors">
              <Trash2 className="h-4 w-4" />{deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

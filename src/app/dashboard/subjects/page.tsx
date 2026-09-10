import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, BookOpen, FileText } from 'lucide-react'
import { SubjectCard } from '@/components/dashboard/subject-card'
import { CreateSubjectDialog } from '@/components/dashboard/create-subject-dialog'

export const metadata = { title: 'Subjects' }

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subjects } = await supabase
    .from('subjects')
    .select(`id, name, description, color, icon, semester, archived, created_at,
      chapters:chapters(count),
      documents:documents(count)`)
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Subjects</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">{subjects?.length ?? 0} active subjects</p>
        </div>
        <CreateSubjectDialog />
      </div>

      {!subjects || subjects.length === 0 ? (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-20 px-6 text-center">
          <BookOpen className="h-12 w-12 text-[var(--muted-foreground)] mb-4 opacity-40" />
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">No subjects yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-6">Create your first subject to organize your notes, quizzes, and flashcards.</p>
          <CreateSubjectDialog triggerLabel="Create First Subject" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => (
            <SubjectCard key={subject.id} subject={subject as never} />
          ))}
        </div>
      )}
    </div>
  )
}

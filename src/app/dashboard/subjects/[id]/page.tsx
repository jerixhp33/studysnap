import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, BookOpen, HelpCircle } from 'lucide-react'
import { DocumentCard } from '@/components/documents/document-card'
import { UploadDocumentDialog } from '@/components/documents/upload-dialog'
import { ChaptersManager } from '@/components/dashboard/chapters-manager'
import { EditSubjectDialog } from '@/components/dashboard/edit-subject-dialog'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('subjects').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Subject' }
}

export default async function SubjectDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!subject) notFound()

  const [chaptersRes, docsRes, quizCountRes, flashcardCountRes] = await Promise.all([
    supabase.from('chapters').select('id, name, order_index').eq('subject_id', id).order('order_index'),
    supabase.from('documents')
      .select('*, subjects:subjects(name,color)')
      .eq('subject_id', id).eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('subject_id', id).eq('user_id', user.id),
    supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('subject_id', id).eq('user_id', user.id),
  ])

  const chapters = chaptersRes.data ?? []
  const docs = docsRes.data ?? []
  const subjectForUpload = [{ id: subject.id, name: subject.name, color: subject.color }]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard/subjects"
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors shrink-0 mt-0.5"
        >
          <ChevronLeft className="h-5 w-5 text-[var(--muted-foreground)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
            {subject.semester && (
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
                {subject.semester}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{subject.name}</h1>
          {subject.description && (
            <p className="text-[var(--muted-foreground)] text-sm mt-1">{subject.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <EditSubjectDialog subject={subject} />
          <UploadDocumentDialog subjects={subjectForUpload} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Documents', value: docs.length,              icon: FileText  },
          { label: 'Chapters',  value: chapters.length,          icon: BookOpen  },
          { label: 'Quizzes',   value: quizCountRes.count ?? 0,  icon: HelpCircle },
          { label: 'Flashcards',value: flashcardCountRes.count ?? 0, icon: BookOpen },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/quizzes?subject=${id}`}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 h-10 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          Generate Quiz
        </Link>
        <Link
          href={`/dashboard/flashcards?subject=${id}`}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 h-10 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          Flashcards
        </Link>
        <Link
          href={`/dashboard/tutor?subject=${id}`}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 h-10 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors"
        >
          Ask AI Tutor
        </Link>
        <Link
          href={`/dashboard/exams?subject=${id}`}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 h-10 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          Plan Exam
        </Link>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chapters — sidebar on desktop */}
        <div className="lg:col-span-1">
          <ChaptersManager chapters={chapters} subjectId={id} />
        </div>

        {/* Documents — main area */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--foreground)]">Notes ({docs.length})</h2>
          </div>

          {docs.length === 0 ? (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-10 text-center">
              <FileText className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-[var(--foreground)] mb-1">No notes yet</p>
              <p className="text-xs text-[var(--muted-foreground)] mb-4">
                Upload PDFs or images to get started
              </p>
              <UploadDocumentDialog subjects={subjectForUpload} triggerLabel="Upload First Note" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {docs.map(doc => <DocumentCard key={doc.id} doc={doc as never} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

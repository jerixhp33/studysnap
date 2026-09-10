import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Upload } from 'lucide-react'
import { UploadDocumentDialog } from '@/components/documents/upload-dialog'
import { DocumentCard } from '@/components/documents/document-card'

export const metadata = { title: 'My Notes' }

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ upload?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const autoOpen = sp.upload === '1'

  const [docsRes, subjectsRes] = await Promise.all([
    supabase.from('documents').select('id, name, file_type, file_size, page_count, status, error_message, created_at, subject_id, subjects:subjects(name, color)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).eq('archived', false),
  ])

  const docs = docsRes.data ?? []
  const subjects = subjectsRes.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">My Notes</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <UploadDocumentDialog subjects={subjects} autoOpen={autoOpen} />
      </div>

      {docs.length === 0 ? (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-20 px-6 text-center">
          <Upload className="h-12 w-12 text-[var(--muted-foreground)] mb-4 opacity-40" />
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">No notes yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-6">
            Upload your first PDF, image, or text file and StudySnap AI will turn it into a study kit.
          </p>
          <UploadDocumentDialog subjects={subjects} triggerLabel="Upload Notes" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <DocumentCard key={doc.id} doc={doc as never} />
          ))}
        </div>
      )}
    </div>
  )
}

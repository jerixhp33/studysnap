import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TutorClient } from '@/components/tutor/tutor-client'

export const metadata = { title: 'AI Tutor' }

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; doc?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams

  const [profileRes, subjectsRes, docsRes] = await Promise.all([
    supabase.from('profiles')
      .select('learning_level, preferred_language, full_name')
      .eq('id', user.id).single(),
    supabase.from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id).eq('archived', false),
    supabase.from('documents')
      .select('id, name, subject_id')
      .eq('user_id', user.id).eq('status', 'ready')
      .order('created_at', { ascending: false }).limit(30),
  ])

  return (
    <div className="space-y-4 flex flex-col" style={{ minHeight: 'calc(100vh - 10rem)' }}>
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">AI Tutor</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          Ask anything — I&apos;ll answer from your notes
        </p>
      </div>
      <TutorClient
        profile={profileRes.data}
        subjects={subjectsRes.data ?? []}
        documents={docsRes.data ?? []}
        defaultSubjectId={sp.subject}
        defaultDocId={sp.doc}
      />
    </div>
  )
}

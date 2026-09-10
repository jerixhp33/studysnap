import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EvaluatorClient } from '@/components/tutor/evaluator-client'

export const metadata = { title: 'Answer Evaluator' }

export default async function EvaluatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: docs } = await supabase
    .from('documents')
    .select('id, name, subject_id')
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('archived', false)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Answer Evaluator</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          Write an answer — AI evaluates it against your notes and gives detailed feedback
        </p>
      </div>
      <EvaluatorClient documents={docs ?? []} subjects={subjects ?? []} />
    </div>
  )
}

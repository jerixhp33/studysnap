import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HelpCircle } from 'lucide-react'
import { QuizGeneratorClient } from '@/components/quiz/quiz-generator'

export const metadata = { title: 'Quizzes' }

export default async function QuizzesPage({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const sp = await searchParams

  const [docsRes, subjectsRes, attemptsRes] = await Promise.all([
    supabase.from('documents').select('id, name, subject_id').eq('user_id', user.id).eq('status', 'ready').order('created_at', { ascending: false }),
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).eq('archived', false),
    supabase.from('quiz_attempts').select('id, score, correct_count, total_questions, completed_at, quiz_id, quizzes:quizzes(title)').eq('user_id', user.id).not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(10),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quizzes</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">Test your knowledge from your notes</p>
        </div>
        <Link href="/dashboard/quizzes/history" className="text-sm text-[var(--primary)] hover:underline font-medium">
          View History →
        </Link>
      </div>
      <QuizGeneratorClient
        documents={docsRes.data ?? []}
        subjects={subjectsRes.data ?? []}
        recentAttempts={attemptsRes.data as never ?? []}
        defaultDocId={sp.doc}
      />
    </div>
  )
}

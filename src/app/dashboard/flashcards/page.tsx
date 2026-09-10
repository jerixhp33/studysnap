import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FlashcardsClient } from '@/components/flashcards/flashcards-client'
import { FlashcardManager } from '@/components/flashcards/flashcard-manager'

export const metadata = { title: 'Flashcards' }

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string; subject?: string; view?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const view = sp.view ?? 'study'

  const [cardsRes, docsRes, subjectsRes] = await Promise.all([
    supabase
      .from('flashcards')
      .select('id, front, back, topic, difficulty, confidence, next_review, review_count, subject_id, document_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('documents').select('id, name').eq('user_id', user.id).eq('status', 'ready'),
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).eq('archived', false),
  ])

  const allCards = cardsRes.data ?? []
  const dueCards = allCards.filter(c => !c.next_review || new Date(c.next_review) <= new Date())

  return (
    <div className="space-y-5">
      {/* Header with view switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Flashcards</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            {dueCards.length} due · {allCards.length} total
          </p>
        </div>
        <div className="flex gap-1 bg-[var(--muted)] rounded-xl p-1">
          {(['study', 'manage'] as const).map(v => (
            <a key={v} href={`?view=${v}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                view === v
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}>
              {v}
            </a>
          ))}
        </div>
      </div>

      {view === 'study' ? (
        <FlashcardsClient
          allCards={allCards as never}
          dueCards={dueCards as never}
          documents={docsRes.data ?? []}
          subjects={subjectsRes.data ?? []}
          defaultDocId={sp.doc}
          defaultSubjectId={sp.subject}
        />
      ) : (
        <FlashcardManager
          flashcards={allCards as never}
          subjects={subjectsRes.data ?? []}
        />
      )}
    </div>
  )
}

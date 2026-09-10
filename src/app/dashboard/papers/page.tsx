import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PreviousYearClient } from '@/components/dashboard/previous-year-client'

export const metadata = { title: 'Previous Year Papers' }

export default async function PapersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('user_id', user.id)
    .eq('archived', false)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Previous Year Papers</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          Upload past papers to find question patterns and likely topics
        </p>
      </div>
      <PreviousYearClient subjects={subjects ?? []} />
    </div>
  )
}

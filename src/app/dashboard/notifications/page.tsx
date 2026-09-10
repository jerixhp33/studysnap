import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsClient } from '@/components/notifications/notifications-client'

export const metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Notifications</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          {(notifications ?? []).filter(n => !n.read).length} unread
        </p>
      </div>
      <NotificationsClient initialNotifications={notifications ?? []} />
    </div>
  )
}

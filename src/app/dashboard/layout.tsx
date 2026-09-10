import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { DashboardTopBar } from '@/components/dashboard/dashboard-top-bar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, email, streak_days, total_xp')
    .eq('id', user.id)
    .single()

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Desktop Sidebar */}
      <Sidebar profile={profile} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px]">
        {/* Unified top bar */}
        <DashboardTopBar profile={profile} unreadCount={unreadCount ?? 0} />

        <main className="flex-1 px-4 pb-24 pt-4 lg:px-6 lg:pb-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}

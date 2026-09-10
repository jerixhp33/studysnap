import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/dashboard/settings-client'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, subRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('tier').eq('user_id', user.id).single(),
  ])

  const usageRes = await supabase.from('usage_limits').select('feature, count, period, reset_at')
    .eq('user_id', user.id)
    .eq('period', new Date().toISOString().slice(0, 7)) // YYYY-MM

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">Manage your account and preferences</p>
      </div>
      <SettingsClient
        profile={profileRes.data as never}
        tier={subRes.data?.tier ?? 'free'}
        usage={usageRes.data ?? []}
        userEmail={user.email ?? ''}
      />
    </div>
  )
}

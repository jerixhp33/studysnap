import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Users, FileText, Brain, BookOpen } from 'lucide-react'

export const metadata = { title: 'Admin' }

async function requireAdminServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  if (!adminEmails.includes(user.email ?? '')) redirect('/dashboard')
  return user
}

export default async function AdminPage() {
  await requireAdminServer()
  const admin = createAdminClient()

  const [usersRes, docsRes, genRes, subjectsRes] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('documents').select('id', { count: 'exact', head: true }),
    admin.from('ai_generations').select('id', { count: 'exact', head: true }),
    admin.from('subjects').select('id', { count: 'exact', head: true }),
  ])

  const recentUsers = await admin.from('profiles').select('id, email, full_name, created_at, streak_days').order('created_at', { ascending: false }).limit(10)
  const recentGen = await admin.from('ai_generations').select('user_id, feature, created_at').order('created_at', { ascending: false }).limit(20)

  const stats = [
    { label: 'Total Users', value: usersRes.count ?? 0, icon: Users, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
    { label: 'Documents', value: docsRes.count ?? 0, icon: FileText, color: 'text-[var(--info)]', bg: 'bg-[var(--info-bg)]' },
    { label: 'AI Generations', value: genRes.count ?? 0, icon: Brain, color: 'text-[var(--success)]', bg: 'bg-[var(--success-bg)]' },
    { label: 'Subjects', value: subjectsRes.count ?? 0, icon: BookOpen, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-bg)]' },
  ]

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
          <p className="text-[var(--muted-foreground)] text-sm">StudySnap AI system overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <div className={`inline-flex p-2.5 rounded-lg ${bg} mb-3`}><Icon className={`h-5 w-5 ${color}`} /></div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{value.toLocaleString()}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-semibold text-[var(--foreground)] mb-4">Recent Users</h2>
            <div className="space-y-3">
              {recentUsers.data?.map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] text-sm font-bold shrink-0">
                    {(u.full_name?.[0] ?? u.email?.[0] ?? 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{u.full_name ?? u.email}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{new Date(u.created_at).toLocaleDateString()} · 🔥 {u.streak_days}d</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-semibold text-[var(--foreground)] mb-4">Recent AI Usage</h2>
            <div className="space-y-2">
              {recentGen.data?.map((g, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--foreground)] capitalize font-medium">{g.feature.replace('_', ' ')}</span>
                  <span className="text-[var(--muted-foreground)] text-xs">{new Date(g.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { Moon, Sun, Monitor, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { useTheme } from '@/components/ui/theme-provider'

interface Profile {
  id: string; full_name: string | null; email: string
  learning_level: string; preferred_language: string; daily_goal_minutes: number
  streak_days: number; total_xp: number
}
interface Props {
  profile: Profile | null; tier: string
  usage: { feature: string; count: number; period: string }[]
  userEmail: string
}

const LIMITS: Record<string, number> = {
  documents_per_month: 5, ai_generations_per_month: 100,
  quiz_generations_per_month: 20, flashcard_generations_per_month: 30,
  tutor_questions_per_day: 20,
}

type Theme = 'light' | 'dark' | 'system'
const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function SettingsClient({ profile, tier, usage, userEmail }: Props) {
  const [name, setName] = useState(profile?.full_name ?? '')
  const [level, setLevel] = useState(profile?.learning_level ?? 'college')
  const [language, setLanguage] = useState(profile?.preferred_language ?? 'english')
  const [goal, setGoal] = useState(profile?.daily_goal_minutes ?? 60)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name, learning_level: level, preferred_language: language, daily_goal_minutes: goal })
      .eq('id', profile!.id)
    if (error) toast({ type: 'error', title: 'Save failed', description: error.message })
    else { toast({ type: 'success', title: 'Profile saved!' }); router.refresh() }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getUsage = (feature: string) => usage.find(u => u.feature === feature)?.count ?? 0

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-14 w-14 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold text-xl shrink-0">
            {(profile?.full_name?.[0] ?? userEmail[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--foreground)] truncate">{profile?.full_name ?? 'Student'}</p>
            <p className="text-sm text-[var(--muted-foreground)] truncate">{userEmail}</p>
            <span className="mt-1 inline-block text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full capitalize">
              {tier} Plan
            </span>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Full Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Learning Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
                {['beginner', 'simple', 'college', 'exam', 'interview'].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
                <option value="english">English</option>
                <option value="tamil">Tamil</option>
                <option value="hindi">Hindi</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Daily Study Goal</label>
            <select value={goal} onChange={e => setGoal(+e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
              {[30, 45, 60, 90, 120, 180, 240].map(m => (
                <option key={m} value={m}>{m} minutes / day</option>
              ))}
            </select>
          </div>
          <button
            type="submit" disabled={saving}
            className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Appearance</h2>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                theme === value
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Usage this month */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Usage This Month</h2>
        <div className="space-y-3">
          {[
            { key: 'documents_per_month',           label: 'Documents Uploaded' },
            { key: 'ai_generations_per_month',       label: 'AI Generations' },
            { key: 'quiz_generations_per_month',     label: 'Quizzes Generated' },
            { key: 'flashcard_generations_per_month',label: 'Flashcard Sets' },
          ].map(({ key, label }) => {
            const used = getUsage(key)
            const limit = LIMITS[key] ?? 100
            const pct = Math.min(100, Math.round((used / limit) * 100))
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--foreground)]">{label}</span>
                  <span className={`font-medium ${pct >= 90 ? 'text-[var(--error)]' : 'text-[var(--muted-foreground)]'}`}>
                    {used} / {limit}
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 90 ? 'var(--error)' : pct >= 70 ? 'var(--warning)' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/10">
          <p className="text-sm font-semibold text-[var(--primary)]">Free Plan</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Limits reset on the 1st of each month. Pro plan coming soon.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Your Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Study Streak', value: `${profile?.streak_days ?? 0} days`, emoji: '🔥' },
            { label: 'Total XP',     value: `${profile?.total_xp ?? 0} XP`,   emoji: '⭐' },
          ].map(s => (
            <div key={s.label} className="bg-[var(--muted)] rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{s.emoji}</p>
              <p className="font-bold text-[var(--foreground)]">{s.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 h-11 border border-[var(--error)]/30 text-[var(--error)] rounded-xl text-sm font-medium hover:bg-[var(--error-bg)] transition-colors"
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
    </div>
  )
}

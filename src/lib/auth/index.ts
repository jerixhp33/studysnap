import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'

export async function getRequiredUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user
}

export async function getOptionalUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return data
}

export async function getRequiredProfile(): Promise<{ user: Awaited<ReturnType<typeof getRequiredUser>>; profile: Profile }> {
  const user = await getRequiredUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Create profile if missing (first login)
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select()
      .single()

    return { user, profile: newProfile as Profile }
  }

  return { user, profile: profile as Profile }
}

// ─── Admin check ──────────────────────────────────────────────────────────────

export async function requireAdmin() {
  const user = await getRequiredUser()

  // Admin emails from environment variable
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim())

  if (!adminEmails.includes(user.email ?? '')) {
    redirect('/dashboard')
  }

  return user
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast({ type: 'error', title: 'Password too short', description: 'Use at least 8 characters.' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast({ type: 'error', title: 'Signup failed', description: error.message })
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast({ type: 'error', title: 'Google login failed', description: error.message })
      setGoogleLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-[var(--success)] flex justify-center mb-4"><CheckCircle className="h-14 w-14" /></div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Check your email</h2>
          <p className="text-[var(--muted-foreground)] mb-6">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-[var(--primary)] mb-6">
            <BookOpen className="h-6 w-6" />
            StudySnap AI
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Start studying smarter</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">Free account · No credit card needed</p>
        </div>

        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <button
            onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-medium py-2.5 rounded-xl hover:bg-[var(--muted)] transition-colors mb-4 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
          <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-[var(--border)]" /><span className="text-xs text-[var(--muted-foreground)]">or</span><div className="flex-1 h-px bg-[var(--border)]" /></div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5" htmlFor="name">Full name</label>
              <input id="name" type="text" autoComplete="name" required value={name} onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-colors"
                placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5" htmlFor="pw">Password</label>
              <div className="relative">
                <input id="pw" type={showPw ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-colors"
                  placeholder="Min. 8 characters" minLength={8} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-[var(--primary)] text-white font-semibold rounded-xl hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) { toast({ type: 'error', title: 'Error', description: error.message }); setLoading(false) }
    else setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-[var(--success)] flex justify-center mb-4"><CheckCircle className="h-14 w-14" /></div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Check your email</h2>
        <p className="text-[var(--muted-foreground)] mb-6">Password reset link sent to <strong>{email}</strong>.</p>
        <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">Back to sign in</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-[var(--primary)] mb-6"><BookOpen className="h-6 w-6" />StudySnap AI</Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Reset password</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">Enter your email to receive a reset link</p>
        </div>
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5" htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-colors"
                placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-[var(--primary)] text-white font-semibold rounded-xl hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}

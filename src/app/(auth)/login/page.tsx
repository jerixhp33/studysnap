import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="skeleton h-96 w-96 rounded-2xl" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

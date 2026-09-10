'use client'
import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to monitoring service in production
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-[var(--error)] mb-4">
        <AlertCircle className="h-14 w-14 mx-auto" />
      </div>
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Something went wrong</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm">
        StudySnap encountered an unexpected error. Your notes are safe.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 bg-[var(--primary)] text-white font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary-dark)] transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  )
}

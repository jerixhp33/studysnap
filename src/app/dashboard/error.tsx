'use client'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-[var(--error)] mb-4">
        <AlertCircle className="h-12 w-12 mx-auto" />
      </div>
      <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">Page error</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-5 max-w-xs">
        This page encountered an error. Try refreshing.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  )
}

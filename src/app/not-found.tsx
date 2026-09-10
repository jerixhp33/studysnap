import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-[var(--primary)] mb-6">
        <BookOpen className="h-16 w-16 mx-auto opacity-60" />
      </div>
      <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">404</h1>
      <p className="text-lg text-[var(--muted-foreground)] mb-2">Page not found</p>
      <p className="text-sm text-[var(--muted-foreground)] mb-8 max-w-xs">
        This page doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary-dark)] transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-[var(--border)] text-[var(--foreground)] font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--muted)] transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  )
}

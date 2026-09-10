'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from './button'

interface ErrorStateProps {
  title?: string
  description?: string
  retry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  retry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 text-[var(--error)]">
        <AlertCircle className="h-12 w-12" />
      </div>
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-6">{description}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

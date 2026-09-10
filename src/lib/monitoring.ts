/**
 * Sentry-compatible error monitoring.
 * Drop in your SENTRY_DSN to activate. Works silently without it.
 */

export interface ErrorContext {
  userId?: string
  feature?: string
  documentId?: string
  extra?: Record<string, unknown>
}

export function captureError(error: unknown, context?: ErrorContext): void {
  if (typeof window === 'undefined') {
    // Server-side
    console.error('[StudySnap Error]', error, context)
  } else {
    // Client-side — hook for Sentry if configured
    if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: unknown, ctx?: unknown) => void } }).Sentry) {
      (window as unknown as { Sentry: { captureException: (e: unknown, ctx?: unknown) => void } }).Sentry.captureException(error, {
        extra: context,
      })
    } else {
      console.error('[StudySnap Error]', error, context)
    }
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (level === 'error') console.error('[StudySnap]', message)
  else if (level === 'warning') console.warn('[StudySnap]', message)
  else console.log('[StudySnap]', message)
}

/**
 * Wrap an async function with error monitoring.
 * Usage: const safeFunc = withMonitoring(myAsyncFunc, { feature: 'quiz' })
 */
export function withMonitoring<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      captureError(error, context)
      throw error
    }
  }
}

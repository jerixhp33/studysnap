'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles = {
  success: 'border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]',
  error: 'border-[var(--error)] bg-[var(--error-bg)] text-[var(--error)]',
  info: 'border-[var(--info)] bg-[var(--info-bg)] text-[var(--info)]',
  warning: 'border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)]',
}

function ToastItem({ toast: t, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  const Icon = icons[t.type]

  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), t.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [t.id, t.duration, dismiss])

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-lg',
        'animate-in slide-in-from-right-full duration-200',
        styles[t.type]
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--foreground)]">{t.title}</p>
        {t.description && (
          <p className="text-sm opacity-80 mt-0.5 text-[var(--foreground)]">{t.description}</p>
        )}
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 w-full max-w-sm md:bottom-4"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  )
}

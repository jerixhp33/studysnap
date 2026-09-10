'use client'
import { useState } from 'react'
import { Bell, BookOpen, HelpCircle, Calendar, Zap, AlertTriangle, CheckCheck, Trash2 } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string; type: string; title: string; message: string; read: boolean; created_at: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  study_reminder: BookOpen,
  quiz_reminder: HelpCircle,
  exam_reminder: Calendar,
  flashcards_due: Zap,
  weak_topic: AlertTriangle,
  system: Bell,
}

const TYPE_COLORS: Record<string, string> = {
  study_reminder:  'bg-[var(--primary)]/10 text-[var(--primary)]',
  quiz_reminder:   'bg-[var(--success-bg)] text-[var(--success)]',
  exam_reminder:   'bg-[var(--error-bg)] text-[var(--error)]',
  flashcards_due:  'bg-[var(--warning-bg)] text-[var(--warning)]',
  weak_topic:      'bg-[var(--warning-bg)] text-[var(--warning)]',
  system:          'bg-[var(--muted)] text-[var(--muted-foreground)]',
}

export function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const router = useRouter()
  const supabase = createClient()

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
  }

  async function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (notifications.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-20 px-6 text-center">
        <Bell className="h-12 w-12 text-[var(--muted-foreground)] mb-4 opacity-40" />
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">All caught up!</h3>
        <p className="text-sm text-[var(--muted-foreground)]">No notifications yet. We'll notify you about exams, due flashcards, and study reminders.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        </div>
      )}

      {notifications.map(n => {
        const Icon = TYPE_ICONS[n.type] ?? Bell
        const colorClass = TYPE_COLORS[n.type] ?? TYPE_COLORS.system

        return (
          <div
            key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className={`bg-[var(--card)] rounded-xl border transition-all ${
              n.read
                ? 'border-[var(--border)] opacity-70'
                : 'border-[var(--primary)]/20 cursor-pointer hover:border-[var(--primary)]/40'
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.read ? 'text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                    {n.title}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0" />
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotification(n.id) }}
                      className="text-[var(--muted-foreground)] hover:text-[var(--error)] transition-colors"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1.5">{formatRelativeDate(n.created_at)}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

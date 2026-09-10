'use client'
import Link from 'next/link'
import { Bell, BookOpen } from 'lucide-react'
import { SearchBar } from './search-bar'

interface Props {
  profile: { full_name?: string | null; email?: string | null; avatar_url?: string | null } | null
  unreadCount: number
}

export function DashboardTopBar({ profile, unreadCount }: Props) {
  const initials = (profile?.full_name?.[0] ?? profile?.email?.[0] ?? 'U').toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 lg:px-6 bg-[var(--card)]/80 backdrop-blur-sm border-b border-[var(--border)]">
      {/* Logo — only visible on mobile (desktop has sidebar) */}
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-[var(--primary)] lg:hidden shrink-0">
        <BookOpen className="h-5 w-5" />
        <span className="text-sm">StudySnap</span>
      </Link>

      {/* Search — hidden on small mobile, shown on larger screens */}
      <div className="hidden sm:flex flex-1">
        <SearchBar />
      </div>

      {/* Spacer on mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification bell */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-[var(--muted-foreground)]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-[var(--error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar — links to settings */}
        <Link
          href="/dashboard/settings"
          className="h-8 w-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-semibold text-sm hover:ring-2 hover:ring-[var(--primary)] transition-all"
          aria-label="Settings"
        >
          {initials}
        </Link>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, FileText, Zap, HelpCircle, Brain,
  Calendar, BarChart3, Settings, LogOut, PenLine, Bell, FileSearch,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/dashboard/subjects',   icon: BookOpen,         label: 'Subjects'    },
  { href: '/dashboard/notes',      icon: FileText,         label: 'My Notes'    },
  { href: '/dashboard/flashcards', icon: Zap,              label: 'Flashcards'  },
  { href: '/dashboard/quizzes',    icon: HelpCircle,       label: 'Quizzes'     },
  { href: '/dashboard/tutor',      icon: Brain,            label: 'AI Tutor'    },
  { href: '/dashboard/evaluate',   icon: PenLine,          label: 'Evaluator'   },
  { href: '/dashboard/papers',     icon: FileSearch,       label: 'Past Papers' },
  { href: '/dashboard/exams',      icon: Calendar,         label: 'Exam Planner'},
  { href: '/dashboard/progress',   icon: BarChart3,        label: 'Progress'    },
]

const bottomItems = [
  { href: '/dashboard/notifications', icon: Bell,     label: 'Notifications' },
  { href: '/dashboard/settings',      icon: Settings, label: 'Settings'      },
]

interface SidebarProps {
  profile: {
    full_name?: string | null; email?: string | null
    avatar_url?: string | null; streak_days?: number
  } | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] bg-[var(--card)] border-r border-[var(--border)] z-40">
      {/* Logo */}
      <div className="px-4 h-16 flex items-center border-b border-[var(--border)] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-[var(--primary)]">
          <BookOpen className="h-5 w-5" />
          <span>StudySnap AI</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-2 border-t border-[var(--border)] shrink-0 space-y-0.5">
        {bottomItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      {/* User */}
      <div className="p-3 border-t border-[var(--border)] shrink-0">
        {(profile?.streak_days ?? 0) > 0 && (
          <div className="px-3 py-2 mb-2 bg-[var(--warning-bg)] rounded-lg flex items-center gap-2">
            <span className="text-base" aria-hidden>🔥</span>
            <span className="text-xs font-semibold text-[var(--warning)]">
              {profile?.streak_days}-day streak
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-semibold text-sm shrink-0">
            {(profile?.full_name?.[0] ?? profile?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {profile?.full_name ?? 'Student'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">{profile?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-[var(--muted-foreground)] hover:text-[var(--error)] transition-colors shrink-0"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, HelpCircle, Brain, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Home'     },
  { href: '/dashboard/notes',    icon: FileText,         label: 'Notes'    },
  { href: '/dashboard/quizzes',  icon: HelpCircle,       label: 'Quiz'     },
  { href: '/dashboard/tutor',    icon: Brain,            label: 'Tutor'    },
  { href: '/dashboard/progress', icon: BarChart3,        label: 'Progress' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] border-t border-[var(--border)] bottom-nav"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors',
                active ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

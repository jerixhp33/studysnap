import { cn } from '@/lib/utils'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="mb-4 text-[var(--muted-foreground)] opacity-60">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-6">{description}</p>
      )}
      {action && (
        action.href ? (
          <Button asChild>
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  )
}

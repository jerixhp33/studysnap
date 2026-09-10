import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-white',
        secondary: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
        success: 'bg-[var(--success-bg)] text-[var(--success)]',
        warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
        error: 'bg-[var(--error-bg)] text-[var(--error)]',
        info: 'bg-[var(--info-bg)] text-[var(--info)]',
        outline: 'border border-[var(--border)] text-[var(--foreground)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

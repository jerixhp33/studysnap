import { BADGES } from '@/lib/badges'

interface Props {
  earnedBadgeIds: string[]
  showLocked?: boolean
}

export function BadgesDisplay({ earnedBadgeIds, showLocked = true }: Props) {
  const allBadges = Object.values(BADGES)
  const earned = new Set(earnedBadgeIds)

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
      <h2 className="font-semibold text-[var(--foreground)] mb-4">
        Badges <span className="text-[var(--muted-foreground)] font-normal text-sm">({earnedBadgeIds.length}/{allBadges.length})</span>
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {allBadges.map(badge => {
          const isEarned = earned.has(badge.id)
          if (!isEarned && !showLocked) return null
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                isEarned
                  ? 'border-[var(--primary)]/20 bg-[var(--primary)]/5'
                  : 'border-[var(--border)] opacity-40 grayscale'
              }`}
              title={badge.description}
            >
              <span className="text-2xl" role="img" aria-label={badge.name}>{badge.emoji}</span>
              <p className="text-[10px] font-medium text-[var(--foreground)] leading-tight">{badge.name}</p>
              {isEarned && (
                <span className="text-[9px] text-[var(--primary)] font-semibold">+{badge.xp} XP</span>
              )}
            </div>
          )
        })}
      </div>
      {earnedBadgeIds.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)] text-center mt-2">
          Complete quizzes, upload notes, and build your streak to earn badges!
        </p>
      )}
    </div>
  )
}

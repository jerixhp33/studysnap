export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
            <div className="h-10 w-10 skeleton rounded-lg" />
            <div className="h-6 w-16 skeleton rounded" />
            <div className="h-4 w-24 skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="h-5 w-32 skeleton rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 h-24 skeleton" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-3 h-40 skeleton" />
        ))}
      </div>
    </div>
  )
}

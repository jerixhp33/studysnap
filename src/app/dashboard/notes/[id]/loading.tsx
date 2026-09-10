export default function DocumentLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 skeleton rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-64 skeleton rounded-lg" />
          <div className="h-4 w-48 skeleton rounded" />
        </div>
      </div>
      <div className="flex gap-1 bg-[var(--muted)] rounded-xl p-1">
        {[0,1,2,3,4].map(i => <div key={i} className="flex-1 h-9 skeleton rounded-lg" />)}
      </div>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
        <div className="h-5 w-40 skeleton rounded" />
        <div className="space-y-2">
          {[0,1,2,3,4,5].map(i => <div key={i} className="h-4 skeleton rounded" style={{width: `${70+Math.random()*30}%`}} />)}
        </div>
      </div>
    </div>
  )
}

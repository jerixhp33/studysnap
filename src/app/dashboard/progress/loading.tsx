export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 skeleton rounded-lg" />
        <div className="h-4 w-72 skeleton rounded" />
      </div>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <div className="h-5 w-36 skeleton rounded" />
        <div className="h-32 skeleton rounded-xl" />
        <div className="h-11 skeleton rounded-xl" />
      </div>
    </div>
  )
}

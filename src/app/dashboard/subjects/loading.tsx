export default function SubjectsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <div className="space-y-1"><div className="h-7 w-32 skeleton rounded-lg" /><div className="h-4 w-24 skeleton rounded" /></div>
        <div className="h-10 w-36 skeleton rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 h-36 skeleton" />
        ))}
      </div>
    </div>
  )
}

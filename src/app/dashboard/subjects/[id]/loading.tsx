export default function SubjectDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 skeleton rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-48 skeleton rounded-lg" />
          <div className="h-4 w-64 skeleton rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="h-48 skeleton rounded-xl" />
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-40 skeleton rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

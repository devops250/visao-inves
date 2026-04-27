export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-navy-100 p-4 h-24">
            <div className="h-3 bg-navy-100 rounded w-2/3 mb-3" />
            <div className="h-6 bg-navy-200 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-navy-100 p-6 h-40">
        <div className="h-4 bg-navy-100 rounded w-1/3 mb-4" />
        <div className="h-3 bg-navy-100 rounded w-full mb-2" />
        <div className="h-3 bg-navy-100 rounded w-5/6" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-navy-100 p-5 h-20">
          <div className="h-4 bg-navy-100 rounded w-1/4 mb-2" />
          <div className="h-3 bg-navy-100 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

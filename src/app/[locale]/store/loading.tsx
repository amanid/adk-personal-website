/** Skeleton shown while the bookstore listing loads — prevents layout shift. */
export default function StoreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-busy="true">
      <div className="mb-10 text-center">
        <div className="h-9 w-56 mx-auto rounded-lg bg-white/10 animate-pulse" />
        <div className="h-4 w-96 max-w-full mx-auto mt-4 rounded bg-white/5 animate-pulse" />
      </div>

      <div className="glass rounded-xl p-4 mb-6">
        <div className="h-11 w-full rounded-lg bg-white/5 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass rounded-xl overflow-hidden">
            <div className="aspect-[3/4] bg-white/10 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-white/5 animate-pulse" />
              <div className="h-8 w-full rounded-lg bg-white/5 animate-pulse mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

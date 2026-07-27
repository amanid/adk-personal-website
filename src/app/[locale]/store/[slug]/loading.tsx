/** Skeleton shown while a book detail page loads. */
export default function BookDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-busy="true">
      <div className="h-4 w-32 rounded bg-white/5 animate-pulse mb-6" />
      <div className="grid md:grid-cols-[320px_1fr] gap-8 lg:gap-12">
        <div>
          <div className="glass rounded-xl aspect-[3/4] bg-white/10 animate-pulse" />
          <div className="glass rounded-xl p-5 mt-4 space-y-4">
            <div className="h-7 w-24 rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded-lg bg-white/5 animate-pulse" />
            <div className="h-10 w-full rounded-lg bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-9 w-3/4 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-5 w-1/2 rounded bg-white/5 animate-pulse" />
          <div className="flex gap-4 mt-4">
            <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="space-y-2 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

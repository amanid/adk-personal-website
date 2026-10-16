/** Skeleton shown while the bookstore listing loads — prevents layout shift. */
export default function StoreLoading() {
  const block = "rounded-[var(--radius-sm)] bg-[var(--hover-wash)] animate-pulse";
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20" aria-busy="true">
      <div className="mb-12 md:mb-16 max-w-2xl">
        <div className={`h-3 w-20 ${block}`} />
        <div className={`h-12 md:h-16 w-72 max-w-full mt-4 ${block}`} />
        <div className={`h-4 w-96 max-w-full mt-5 ${block}`} />
      </div>

      <div className={`h-11 w-full mb-8 ${block}`} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className={`aspect-[3/4] ${block}`} />
            <div className="pt-4 space-y-3">
              <div className={`h-5 w-3/4 ${block}`} />
              <div className={`h-3 w-1/3 ${block}`} />
              <div className={`h-11 w-full mt-4 ${block}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

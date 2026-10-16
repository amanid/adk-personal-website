/** Skeleton shown while a book detail page loads. */
export default function BookDetailLoading() {
  const block = "rounded-[var(--radius-sm)] bg-[var(--hover-wash)] animate-pulse";
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14" aria-busy="true">
      <div className={`h-4 w-32 mb-8 ${block}`} />
      <div className="grid md:grid-cols-[minmax(0,340px)_1fr] gap-8 lg:gap-14">
        <div className={`aspect-[3/4] max-w-[340px] w-full mx-auto ${block}`} />
        <div className="space-y-4">
          <div className={`h-3 w-20 ${block}`} />
          <div className={`h-12 w-3/4 ${block}`} />
          <div className={`h-5 w-1/2 ${block}`} />
          <div className={`h-4 w-2/3 mt-4 ${block}`} />
          <div className="card p-6 mt-6 space-y-4">
            <div className={`h-8 w-28 ${block}`} />
            <div className={`h-11 w-full ${block}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="section-padding min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

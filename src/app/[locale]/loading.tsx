import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("common");
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 min-h-[60vh]" role="status">
      <span
        aria-hidden
        className="inline-block w-5 h-5 rounded-full border-2 border-gold/30 border-t-gold animate-spin align-middle mr-3"
      />
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted align-middle">
        {t("loading")}
      </span>
    </div>
  );
}

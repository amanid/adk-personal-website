"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import PromoCard from "./PromoCard";
import type { PromoItem } from "@/lib/promos";

/** A titled row of house-ad tiles with a "see all" link. Renders nothing when empty. */
export default function PromoStrip({
  items,
  placement,
  title,
  intro,
  seeAllHref = "/store",
  className = "",
}: {
  items: PromoItem[];
  placement: string;
  title?: string;
  intro?: string;
  seeAllHref?: string;
  className?: string;
}) {
  const t = useTranslations("promo");
  if (!items.length) return null;
  return (
    <section className={`hairline pt-12 ${className}`} aria-labelledby={`promo-${placement}`}>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow mb-2">{t("from_store")}</p>
          <h2 id={`promo-${placement}`} className="font-display text-2xl">
            {title ?? t("strip_title")}
          </h2>
          {intro && <p className="text-sm text-text-secondary mt-2 max-w-xl">{intro}</p>}
        </div>
        <Link href={seeAllHref} className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light shrink-0">
          {t("see_all")} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className={`grid gap-6 ${items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : items.length === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"}`}>
        {items.map((item) => (
          <PromoCard key={`${item.kind}-${item.slug}`} item={item} placement={placement} variant="tile" />
        ))}
      </div>
    </section>
  );
}

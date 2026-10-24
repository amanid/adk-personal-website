"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatPriceShort } from "@/lib/utils";
import { usePromoTracking } from "./PromoCard";
import type { Announcement } from "@/lib/promos";

const KEY = "adk_promo_dismissed";

/**
 * One line under the navigation: a launch offer or a new title, from the
 * data alone. Dismissed per item, so a new book after a dismissal shows again.
 */
export default function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  const t = useTranslations("promo");
  const fr = useLocale() === "fr";
  const [open, setOpen] = useState(false);
  const item = announcement?.item;
  const placement = "bar";
  const { ref, onClick } = usePromoTracking(item ?? { kind: "book", slug: "none" } as Announcement["item"], placement);

  useEffect(() => {
    if (!item) return;
    try {
      setOpen(localStorage.getItem(KEY) !== item.slug);
    } catch {
      setOpen(true);
    }
  }, [item]);

  if (!announcement || !item || !open) return null;
  const title = fr && item.titleFr ? item.titleFr : item.title;
  const until = item.saleEndsAt
    ? new Intl.DateTimeFormat(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "long" }).format(new Date(item.saleEndsAt))
    : null;
  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, item.slug);
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="border-b border-glass-border bg-surface-1" role="region" aria-label={t("bar_label")}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-10 py-2 flex items-center gap-3 text-sm">
        <span className="eyebrow text-[11px] shrink-0">{announcement.kind === "sale" ? t("launch_offer") : t("new_label")}</span>
        <Link href={item.href} onClick={onClick} className="min-w-0 flex-1 truncate text-text-primary hover:text-gold transition-colors">
          <span className="font-display">{title}</span>
          {item.priceCents !== null && (
            <span className="font-mono tabular-nums text-text-secondary ml-2">
              {formatPriceShort(item.priceCents, item.currency)}
              {item.regularCents ? <span className="line-through text-text-muted ml-1.5">{formatPriceShort(item.regularCents, item.currency)}</span> : null}
            </span>
          )}
          {until && <span className="text-text-muted ml-2 hidden sm:inline">{t("until", { date: until })}</span>}
          <ArrowRight className="inline w-3.5 h-3.5 ml-1.5 align-[-2px]" aria-hidden />
        </Link>
        <button type="button" onClick={dismiss} aria-label={t("dismiss")} className="shrink-0 p-1.5 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)]">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

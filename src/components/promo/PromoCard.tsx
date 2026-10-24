"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, BookOpen, FileText } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/Button";
import { formatPriceShort } from "@/lib/utils";
import { PROMO_COOKIE, PROMO_COOKIE_DAYS, promoSource, type PromoItem } from "@/lib/promos";

/*
 * One house ad. Counts an impression the first time half of it is on screen
 * and a click when followed; a click also leaves the 30-day source cookie
 * that the order will carry. Both beacons are fire-and-forget.
 */

function beacon(body: Record<string, string>) {
  try {
    const data = JSON.stringify(body);
    if (navigator.sendBeacon) navigator.sendBeacon("/api/promo/event", new Blob([data], { type: "application/json" }));
    else fetch("/api/promo/event", { method: "POST", body: data, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function usePromoTracking(item: PromoItem, placement: string) {
  const ref = useRef<HTMLElement | null>(null);
  const seen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen.current || typeof IntersectionObserver === "undefined") return;
    const o = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !seen.current) {
          seen.current = true;
          beacon({ placement, itemKind: item.kind, itemSlug: item.slug, event: "impression" });
          o.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    o.observe(el);
    return () => o.disconnect();
  }, [item.kind, item.slug, placement]);

  const onClick = () => {
    beacon({ placement, itemKind: item.kind, itemSlug: item.slug, event: "click" });
    const src = promoSource(placement, item.slug);
    if (src) {
      try {
        document.cookie = `${PROMO_COOKIE}=${encodeURIComponent(src)}; Max-Age=${PROMO_COOKIE_DAYS * 86_400}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      } catch {
        /* ignore */
      }
    }
  };

  return { ref, onClick };
}

function Cover({ item, className }: { item: PromoItem; className: string }) {
  const t = useTranslations("promo");
  if (item.coverUrl) {
    return (
      <div className={`relative overflow-hidden rounded-[var(--radius-sm)] bg-navy border border-glass-border shadow-[var(--elev-md)] ${className}`}>
        <Image src={item.coverUrl} alt={t("cover_alt", { title: item.title })} fill sizes="160px" className="object-cover" />
      </div>
    );
  }
  // A publication has no cover: a typographic plate with its year.
  return (
    <div className={`flex flex-col items-start justify-between p-3 rounded-[var(--radius-sm)] bg-surface-2 border border-glass-border ${className}`} aria-hidden>
      {item.kind === "publication" ? <FileText className="w-5 h-5 text-gold" strokeWidth={1.5} /> : <BookOpen className="w-5 h-5 text-gold" strokeWidth={1.5} />}
      <span className="font-mono text-xs text-text-muted tabular-nums">{item.year}</span>
    </div>
  );
}

function Price({ item }: { item: PromoItem }) {
  const t = useTranslations("promo");
  if (item.priceCents === null) return null;
  const free = item.priceCents === 0 && !item.payWhatYouWant;
  return (
    <span className="inline-flex items-baseline gap-x-2 font-mono tabular-nums text-sm">
      {item.payWhatYouWant && <span className="text-xs text-text-secondary">{t("from")}</span>}
      <span className={free ? "text-success" : "text-text-primary"}>{free ? t("free") : formatPriceShort(item.priceCents, item.currency)}</span>
      {item.regularCents ? <span className="text-text-muted line-through">{formatPriceShort(item.regularCents, item.currency)}</span> : null}
    </span>
  );
}

export default function PromoCard({
  item,
  placement,
  variant = "inline",
  eyebrow,
}: {
  item: PromoItem;
  placement: string;
  variant?: "inline" | "tile";
  /** Overrides the default label ("From the bookstore" / "Related reading"). */
  eyebrow?: string;
}) {
  const t = useTranslations("promo");
  const fr = useLocale() === "fr";
  const { ref, onClick } = usePromoTracking(item, placement);
  const title = fr && item.titleFr ? item.titleFr : item.title;
  const blurb = fr && item.blurbFr ? item.blurbFr : item.blurb;
  const label = eyebrow ?? (item.kind === "book" ? t("from_store") : t("related_reading"));
  const cta = item.kind === "book" ? (item.productKind === "BOOK" ? t("get_book") : t("get_title")) : t("read_report");

  if (variant === "tile") {
    return (
      <article ref={ref as React.RefObject<HTMLElement>} className="group flex flex-col min-w-0">
        <Link href={item.href} onClick={onClick} className="block" tabIndex={-1} aria-hidden="true">
          <Cover item={item} className="aspect-[3/4] transition-transform duration-300 group-hover:-translate-y-1" />
        </Link>
        {item.regularCents ? <p className="eyebrow mt-3 text-[11px]">{t("launch_offer")}</p> : null}
        <h3 className="font-display text-lg leading-snug line-clamp-2 mt-3" title={title}>
          <Link href={item.href} onClick={onClick} className="hover:text-gold transition-colors">
            {title}
          </Link>
        </h3>
        <p className="text-sm text-text-secondary mt-1 line-clamp-2">{blurb}</p>
        <p className="mt-auto pt-3">
          <Price item={item} />
        </p>
      </article>
    );
  }

  return (
    <aside ref={ref as React.RefObject<HTMLElement>} className="my-8 card p-5 md:p-6" aria-label={label}>
      <div className="flex gap-5 md:gap-6">
        <Link href={item.href} onClick={onClick} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <Cover item={item} className="w-20 md:w-24 aspect-[3/4]" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-2">
            {label}
            {item.regularCents ? <span className="ml-3 text-text-muted">{t("launch_offer")}</span> : null}
          </p>
          <h3 className="font-display text-xl md:text-2xl leading-tight">
            <Link href={item.href} onClick={onClick} className="hover:text-gold transition-colors">
              {title}
            </Link>
          </h3>
          <p className="text-sm text-text-secondary mt-2 line-clamp-2 max-w-xl">{blurb}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href={item.href} onClick={onClick} className={buttonClass(item.kind === "book" ? "primary" : "secondary", "md", "group")}>
              {cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </Link>
            <Price item={item} />
          </div>
        </div>
      </div>
    </aside>
  );
}

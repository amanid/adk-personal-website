"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Layers } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatPrice } from "@/lib/utils";
import { bundleCartId } from "@/lib/pricing";
import AddToCartButton from "./AddToCartButton";

export interface BundleCardData {
  id: string;
  slug: string;
  title: string;
  titleFr: string | null;
  priceCents: number;
  currency: string;
  savingCents: number;
  separateCents: number;
  coverUrl: string | null;
  bookTitles: string[];
  covers: string[];
}

export default function BundleCard({ bundle }: { bundle: BundleCardData }) {
  const t = useTranslations("store");
  const fr = useLocale() === "fr";
  const title = fr && bundle.titleFr ? bundle.titleFr : bundle.title;
  const covers = bundle.coverUrl ? [bundle.coverUrl] : bundle.covers.slice(0, 3);

  return (
    <article className="card p-5 flex flex-col">
      <Link href={`/store/bundles/${bundle.slug}`} className="group block">
        <div className="relative h-40 mb-5 flex items-end justify-center rounded-[var(--radius-sm)] bg-navy/60 pb-3" aria-hidden="true">
          {covers.length === 0 ? (
            <Layers className="w-12 h-12 text-text-muted self-center" />
          ) : (
            covers.map((c, i) => (
              <div
                key={c}
                className="relative w-20 h-28 rounded-[var(--radius-sm)] overflow-hidden border border-glass-border shadow-[var(--elev-md)]"
                style={{ transform: `rotate(${(i - (covers.length - 1) / 2) * 6}deg)`, marginLeft: i ? -18 : 0, zIndex: i }}
              >
                <Image src={c} alt="" fill className="object-cover" sizes="80px" unoptimized />
              </div>
            ))
          )}
        </div>
        <p className="eyebrow mb-1.5">{t("bundles_title")}</p>
        <h3 className="font-display text-xl leading-snug group-hover:text-gold transition-colors">{title}</h3>
      </Link>
      <p className="text-sm text-text-secondary mt-2 line-clamp-2">
        {t("bundle_includes")}: {bundle.bookTitles.join(" · ")}
      </p>
      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono tabular-nums text-lg font-medium">{formatPrice(bundle.priceCents, bundle.currency)}</span>
          {bundle.savingCents > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/15 text-success">
              {t("bundle_save", { amount: formatPrice(bundle.savingCents, bundle.currency) })}
            </span>
          )}
        </div>
        <div className="mt-3">
          <AddToCartButton
            book={{
              bookId: bundleCartId(bundle.id),
              slug: `bundles/${bundle.slug}`,
              title,
              priceCents: bundle.priceCents,
              currency: bundle.currency,
              coverUrl: covers[0] ?? null,
            }}
          />
        </div>
      </div>
    </article>
  );
}

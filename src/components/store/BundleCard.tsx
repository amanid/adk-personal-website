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
    <div className="glass p-5 flex flex-col">
      <Link href={`/store/bundles/${bundle.slug}`} className="block">
        <div className="relative h-36 mb-4 flex items-end justify-center gap-0">
          {covers.length === 0 ? (
            <Layers className="w-12 h-12 text-gold/40 self-center" />
          ) : (
            covers.map((c, i) => (
              <div
                key={c}
                className="relative w-20 h-28 rounded-sm overflow-hidden border border-glass-border shadow-lg"
                style={{ transform: `rotate(${(i - (covers.length - 1) / 2) * 6}deg)`, marginLeft: i ? -18 : 0, zIndex: i }}
              >
                <Image src={c} alt="" fill className="object-cover" sizes="80px" unoptimized />
              </div>
            ))
          )}
        </div>
        <p className="eyebrow mb-1">{t("bundles_title")}</p>
        <h3 className="font-semibold leading-snug hover:text-gold transition-colors">{title}</h3>
      </Link>
      <p className="text-xs text-text-secondary mt-2 line-clamp-2">
        {t("bundle_includes")}: {bundle.bookTitles.join(" · ")}
      </p>
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-gold">{formatPrice(bundle.priceCents, bundle.currency)}</span>
          {bundle.savingCents > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gold/15 text-gold">
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
    </div>
  );
}

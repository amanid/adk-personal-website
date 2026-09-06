"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { BookOpen, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice, fileFormatLabel } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";

export interface StoreBook {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  publicationYear: number;
  priceCents: number;
  currency: string;
  coverUrl?: string | null;
  firstInsight?: string | null;
  category?: string | null;
  tags?: string[];
  featured?: boolean;
  /** What the buyer actually receives — shown so the card isn't a mystery. */
  pageCount?: number | null;
  fileMimeType?: string | null;
}

export default function BookCard({ book }: { book: StoreBook }) {
  const t = useTranslations("store");
  const format = fileFormatLabel(book.fileMimeType);
  return (
    <div className="group glass rounded-xl overflow-hidden flex flex-col hover:border-gold/40 transition-all">
      <Link href={`/store/${book.slug}`} className="block">
        <div className="relative aspect-[3/4] bg-navy/50 overflow-hidden">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={t("coverAlt", { title: book.title })}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold/30">
              <BookOpen className="w-16 h-16" />
            </div>
          )}
          {book.featured && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold text-charcoal text-[10px] font-bold shadow">
              <Star className="w-3 h-3 fill-charcoal" />
              {t("featured")}
            </span>
          )}
          {book.priceCents === 0 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold shadow">
              {t("free")}
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/store/${book.slug}`}>
          {/* title attribute so a clamped title is still readable on hover */}
          <h2
            title={book.title}
            className="font-semibold text-base leading-snug line-clamp-2 hover:text-gold transition-colors"
          >
            {book.title}
          </h2>
        </Link>
        {book.subtitle && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-1">{book.subtitle}</p>
        )}
        {/* Year, format and length: what the buyer is actually getting. A card
            that only shows a price makes a 300-page PDF look like a pamphlet. */}
        <p className="text-xs text-text-secondary mt-1 flex flex-wrap items-center gap-x-1.5">
          <span>{book.publicationYear}</span>
          {format && (
            <>
              <span aria-hidden="true">·</span>
              <span>{format}</span>
            </>
          )}
          {book.pageCount ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{t("pagesCount", { count: book.pageCount })}</span>
            </>
          ) : null}
        </p>
        {book.firstInsight && (
          <p className="text-sm text-text-secondary mt-2 line-clamp-2">{book.firstInsight}</p>
        )}
        <div className="mt-4">
          <span className="text-lg font-bold text-gold">
            {book.priceCents === 0 ? t("free") : formatPrice(book.priceCents, book.currency)}
          </span>
        </div>
        <div className="mt-3">
          <AddToCartButton
            book={{
              bookId: book.id,
              slug: book.slug,
              title: book.title,
              priceCents: book.priceCents,
              currency: book.currency,
              coverUrl: book.coverUrl,
            }}
          />
        </div>
      </div>
    </div>
  );
}

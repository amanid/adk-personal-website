"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice, fileFormatLabel } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";

export interface StoreBook {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  /** The book's own author field; shown under the title when present. */
  author?: string | null;
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
  kind?: string;
  /** Regular price while a launch offer runs. */
  regularCents?: number | null;
  payWhatYouWant?: boolean;
}

/**
 * A book on the shelf: the cover carries the card, the title is set in the
 * serif, and the price sits in mono so a column of cards lines up. The card
 * itself is not a link (it holds an add-to-cart button), so it does not lift
 * on hover; the cover and title are the links.
 */
export default function BookCard({ book }: { book: StoreBook }) {
  const t = useTranslations("store");
  const format = fileFormatLabel(book.fileMimeType);
  const isFree = book.priceCents === 0 && !book.payWhatYouWant;
  return (
    <article className="group flex flex-col min-w-0">
      <Link
        href={`/store/${book.slug}`}
        className="block rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-sm)] bg-navy border border-glass-border shadow-[var(--elev-md)] transition-transform duration-300 group-hover:-translate-y-1">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={t("coverAlt", { title: book.title })}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
              <BookOpen className="w-14 h-14" />
            </div>
          )}
          {book.featured && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[var(--radius-sm)] bg-gold text-charcoal text-xs font-semibold shadow-[var(--elev-sm)]">
              {t("featured")}
            </span>
          )}
          {book.priceCents === 0 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-[var(--radius-sm)] bg-charcoal text-success border border-success/40 text-xs font-semibold shadow-[var(--elev-sm)]">
              {t("free")}
            </span>
          )}
        </div>
      </Link>

      <div className="pt-4 flex flex-col flex-1">
        {book.kind && book.kind !== "BOOK" && (
          <p className="eyebrow mb-1.5">{t(`kind_${book.kind}`)}</p>
        )}
        <h2 className="font-display text-lg leading-snug line-clamp-2" title={book.title}>
          <Link href={`/store/${book.slug}`} className="hover:text-gold transition-colors">
            {book.title}
          </Link>
        </h2>
        {book.author && <p className="text-sm text-text-secondary mt-1 line-clamp-1">{book.author}</p>}
        {book.subtitle && !book.author && (
          <p className="text-sm text-text-secondary mt-1 line-clamp-1">{book.subtitle}</p>
        )}
        {/* Year, format and length: what the buyer is actually getting. */}
        <p className="font-mono tabular-nums text-xs text-text-muted mt-2 flex flex-wrap items-center gap-x-1.5">
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

        <div className="mt-auto pt-4 flex flex-wrap items-baseline gap-x-2">
          {book.payWhatYouWant && <span className="text-xs text-text-secondary">{t("pwyw_from")}</span>}
          <span className={`font-mono tabular-nums text-base font-medium ${isFree ? "text-success" : "text-text-primary"}`}>
            {isFree ? t("free") : formatPrice(book.priceCents, book.currency)}
          </span>
          {book.regularCents ? (
            <span className="font-mono tabular-nums text-sm text-text-muted line-through">
              {formatPrice(book.regularCents, book.currency)}
            </span>
          ) : null}
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
    </article>
  );
}

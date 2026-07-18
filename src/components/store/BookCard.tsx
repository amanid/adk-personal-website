"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";
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
}

export default function BookCard({ book }: { book: StoreBook }) {
  const t = useTranslations("store");
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
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/store/${book.slug}`}>
          <h2 className="font-semibold text-base leading-snug line-clamp-2 hover:text-gold transition-colors">
            {book.title}
          </h2>
        </Link>
        <p className="text-xs text-text-secondary mt-1">{book.publicationYear}</p>
        {book.firstInsight && (
          <p className="text-sm text-text-secondary mt-2 line-clamp-2">{book.firstInsight}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-gold">
            {formatPrice(book.priceCents, book.currency)}
          </span>
        </div>
        <div className="mt-3">
          <AddToCartButton
            book={{
              bookId: book.id,
              slug: book.slug,
              title: book.title,
              priceCents: book.priceCents,
              coverUrl: book.coverUrl,
            }}
          />
        </div>
      </div>
    </div>
  );
}

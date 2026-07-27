"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X, BookOpen, SlidersHorizontal } from "lucide-react";
import BookCard, { type StoreBook } from "./BookCard";

type SortKey = "featured" | "priceLow" | "priceHigh" | "titleAsc";

export default function StoreBrowser({ books }: { books: StoreBook[] }) {
  const t = useTranslations("store");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) if (b.category) set.add(b.category);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = books.filter((b) => {
      if (freeOnly && b.priceCents !== 0) return false;
      if (category && b.category !== category) return false;
      if (q) {
        const haystack = [b.title, b.subtitle, b.firstInsight, b.category, ...(b.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "priceLow":
          return a.priceCents - b.priceCents;
        case "priceHigh":
          return b.priceCents - a.priceCents;
        case "titleAsc":
          return a.title.localeCompare(b.title);
        default:
          // featured first, then newest (input order already featured→sortOrder→date)
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });
    return list;
  }, [books, query, category, freeOnly, sort]);

  const hasFilters = query.trim() !== "" || category !== "" || freeOnly;

  const chipBase =
    "px-3 py-1.5 rounded-full text-sm border transition-all whitespace-nowrap";
  const chipActive = "border-gold/60 bg-gold/15 text-gold";
  const chipIdle = "border-glass-border text-text-secondary hover:border-gold/40";

  return (
    <div>
      {/* Controls */}
      <div className="glass rounded-xl p-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-text-muted shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label={t("sortLabel")}
              className="flex-1 sm:flex-none px-3 py-2.5 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
            >
              <option value="featured">{t("sortFeatured")}</option>
              <option value="priceLow">{t("sortPriceLow")}</option>
              <option value="priceHigh">{t("sortPriceHigh")}</option>
              <option value="titleAsc">{t("sortTitle")}</option>
            </select>
          </div>
        </div>

        {(categories.length > 0 || books.some((b) => b.priceCents === 0)) && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCategory("");
                setFreeOnly(false);
              }}
              className={`${chipBase} ${!category && !freeOnly ? chipActive : chipIdle}`}
            >
              {t("filterAll")}
            </button>
            {books.some((b) => b.priceCents === 0) && (
              <button
                onClick={() => setFreeOnly((v) => !v)}
                className={`${chipBase} ${freeOnly ? chipActive : chipIdle}`}
              >
                {t("free")}
              </button>
            )}
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory((cur) => (cur === c ? "" : c))}
                className={`${chipBase} ${category === c ? chipActive : chipIdle}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result count + clear */}
      <div className="flex items-center justify-between mb-4 text-sm text-text-secondary">
        <span>{t("resultsCount", { count: filtered.length })}</span>
        {hasFilters && (
          <button
            onClick={() => {
              setQuery("");
              setCategory("");
              setFreeOnly(false);
            }}
            className="inline-flex items-center gap-1 hover:text-gold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {t("clearFilters")}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-text-secondary">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gold/40" />
          <p>{t("noResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

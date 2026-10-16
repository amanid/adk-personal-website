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
  const [kind, setKind] = useState<string>("");
  // Product types present in the catalogue; the filter only appears when
  // there is more than one to choose between.
  const kinds = useMemo(() => [...new Set(books.map((b) => b.kind || "BOOK"))], [books]);
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
      if (kind && (b.kind || "BOOK") !== kind) return false;
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
  }, [books, query, category, kind, freeOnly, sort]);

  const hasFilters = query.trim() !== "" || category !== "" || kind !== "" || freeOnly;

  const chipBase =
    "inline-flex items-center min-h-11 sm:min-h-9 px-3.5 rounded-full text-sm border transition-colors whitespace-nowrap";
  const chipActive = "border-gold/60 bg-gold/15 text-text-primary";
  const chipIdle = "border-glass-border text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]";
  const field =
    "w-full min-h-11 rounded-[var(--radius-md)] bg-navy border border-glass-border focus:border-gold outline-none text-sm";

  return (
    <div>
      {/* Controls */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <label htmlFor="store-search" className="sr-only">
              {t("searchPlaceholder")}
            </label>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="store-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className={`${field} pl-9 pr-3`}
            />
          </div>
          <div className="flex items-center gap-2 sm:w-56">
            <label htmlFor="store-sort" className="sr-only">
              {t("sortLabel")}
            </label>
            <SlidersHorizontal aria-hidden="true" className="w-4 h-4 text-text-muted shrink-0" />
            <select
              id="store-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={`${field} px-3`}
            >
              <option value="featured">{t("sortFeatured")}</option>
              <option value="priceLow">{t("sortPriceLow")}</option>
              <option value="priceHigh">{t("sortPriceHigh")}</option>
              <option value="titleAsc">{t("sortTitle")}</option>
            </select>
          </div>
        </div>

        {kinds.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind((cur) => (cur === k ? "" : k))}
                className={`${chipBase} ${kind === k ? chipActive : chipIdle}`}
              >
                {t(`kind_${k}`)}
              </button>
            ))}
          </div>
        )}

        {(categories.length > 0 || books.some((b) => b.priceCents === 0)) && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={!category && !freeOnly}
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
                type="button"
                aria-pressed={freeOnly}
                onClick={() => setFreeOnly((v) => !v)}
                className={`${chipBase} ${freeOnly ? chipActive : chipIdle}`}
              >
                {t("free")}
              </button>
            )}
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
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
      <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-glass-border text-sm text-text-secondary">
        <span role="status" className="font-mono tabular-nums text-xs uppercase tracking-wider">
          {t("resultsCount", { count: filtered.length })}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("");
              setKind("");
              setFreeOnly(false);
            }}
            className="inline-flex items-center gap-1 min-h-11 px-2 -mr-2 hover:text-text-primary transition-colors"
          >
            <X aria-hidden="true" className="w-3.5 h-3.5" />
            {t("clearFilters")}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-text-secondary">
          <BookOpen aria-hidden="true" className="w-10 h-10 mx-auto mb-4 text-text-muted" />
          <p>{t("noResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

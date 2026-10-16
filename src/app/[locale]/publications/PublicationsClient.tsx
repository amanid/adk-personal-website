"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Search, Lock } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import { publications as staticPublications } from "@/data/publications";
import { PUBLICATION_TYPES, getPublicationTypeLabel } from "@/lib/publication-types";
import PublicationStats from "@/components/publications/PublicationStats";
import type { PublicationType } from "@/types";

interface Publication {
  id: string;
  title: string;
  titleFr: string;
  slug: string;
  abstract: string;
  abstractFr: string;
  authors: string[];
  journal: string;
  year: number;
  category: string;
  pdfUrl?: string;
  tags: string[];
  featured: boolean;
  views?: number;
  downloadCount?: number;
  publicationType?: PublicationType;
  doi?: string;
  conferenceName?: string;
  bookTitle?: string;
  institution?: string;
  accessLevel?: "FREE" | "GATED";
}

const categories = [
  "All",
  "Africa Economics",
  "Trade Finance",
  "Digital & Fintech",
  "AI & Technology",
  "Agriculture",
  "Macroeconomics",
  "Data Governance",
];

type SortOption = "year_desc" | "year_asc" | "views" | "downloads";

const chip = (active: boolean) =>
  cn(
    "inline-flex items-center min-h-11 md:min-h-9 px-3.5 text-sm rounded-[var(--radius-sm)] border transition-colors",
    active
      ? "border-gold/40 bg-gold/10 text-gold"
      : "border-glass-border text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]",
  );

export interface DbPublicationRow {
  id: string;
  title: string;
  titleFr: string | null;
  slug: string;
  abstract: string;
  abstractFr: string | null;
  authors: string[];
  journal: string | null;
  year: number;
  category: string | null;
  pdfUrl: string | null;
  accessLevel?: string | null;
  tags: string[];
  featured: boolean;
  views: number;
  downloadCount: number;
  publicationType: string;
  doi: string | null;
  conferenceName: string | null;
  bookTitle: string | null;
  institution: string | null;
}

export default function PublicationsClient({
  initialDbPublications = [],
}: {
  initialDbPublications?: DbPublicationRow[];
}) {
  const t = useTranslations("publications");
  const tTopics = useTranslations("topics");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("year_desc");

  // Merge the static seed set with DB publications (server-provided) once, so the
  // full list is present in the server-rendered HTML.
  const [allPublications] = useState<Publication[]>(() => {
    // Gating is set per publication in the admin panel (the DB); the static
    // catalogue can lag behind, so a DB "GATED" wins.
    const dbGated = new Set(initialDbPublications.filter((p) => p.accessLevel === "GATED").map((p) => p.slug));
    const base = staticPublications.map((p) => ({
      ...p,
      publicationType: p.publicationType as PublicationType,
      ...(dbGated.has(p.slug) ? { accessLevel: "GATED" as const } : {}),
    }));
    const staticSlugs = new Set(staticPublications.map((p) => p.slug));
    const dbMapped: Publication[] = initialDbPublications.map((p) => ({
      id: p.id,
      title: p.title,
      titleFr: p.titleFr || p.title,
      slug: p.slug,
      abstract: p.abstract,
      abstractFr: p.abstractFr || p.abstract,
      authors: p.authors || [],
      journal: p.journal || "",
      year: p.year,
      category: p.category || "",
      pdfUrl: p.pdfUrl || undefined,
      accessLevel: p.accessLevel === "GATED" ? "GATED" : "FREE",
      tags: p.tags || [],
      featured: p.featured || false,
      views: p.views || 0,
      downloadCount: p.downloadCount || 0,
      publicationType: (p.publicationType as PublicationType) || "ANALYTICAL_REPORT",
      doi: p.doi || undefined,
      conferenceName: p.conferenceName || undefined,
      bookTitle: p.bookTitle || undefined,
      institution: p.institution || undefined,
    }));
    const newFromDb = dbMapped.filter((p) => !staticSlugs.has(p.slug));
    return [...base, ...newFromDb];
  });

  const years = useMemo(
    () => [...new Set(allPublications.map((p) => p.year))].sort((a, b) => b - a),
    [allPublications]
  );

  const filtered = useMemo(() => {
    let result = allPublications.filter((pub) => {
      const title = locale === "fr" ? pub.titleFr : pub.title;
      const matchesSearch =
        !search ||
        title.toLowerCase().includes(search.toLowerCase()) ||
        pub.authors.join(" ").toLowerCase().includes(search.toLowerCase()) ||
        pub.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        selectedCategory === "All" || pub.category === selectedCategory;
      const matchesYear = !selectedYear || pub.year === selectedYear;
      const matchesType =
        selectedType === "All" || pub.publicationType === selectedType;
      return matchesSearch && matchesCategory && matchesYear && matchesType;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "year_asc": return a.year - b.year;
        case "views": return (b.views || 0) - (a.views || 0);
        case "downloads": return (b.downloadCount || 0) - (a.downloadCount || 0);
        default: return b.year - a.year;
      }
    });

    return result;
  }, [search, selectedCategory, selectedYear, selectedType, sortBy, locale, allPublications]);

  // Stats computation
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    let totalViews = 0;
    let totalDownloads = 0;
    allPublications.forEach((p) => {
      const type = p.publicationType || "ANALYTICAL_REPORT";
      byType[type] = (byType[type] || 0) + 1;
      totalViews += p.views || 0;
      totalDownloads += p.downloadCount || 0;
    });
    return { total: allPublications.length, byType, totalViews, totalDownloads };
  }, [allPublications]);

  const typesPresent = PUBLICATION_TYPES.filter((pt) => stats.byType[pt.value]);

  const getTypeLabel = (pub: Publication) => {
    return getPublicationTypeLabel(
      (pub.publicationType || "ANALYTICAL_REPORT") as PublicationType,
      locale
    );
  };

  const getVenueInfo = (pub: Publication) => {
    if (pub.journal) return pub.journal;
    if (pub.conferenceName) return pub.conferenceName;
    if (pub.bookTitle) return pub.bookTitle;
    if (pub.institution) return pub.institution;
    return null;
  };

  return (
    <div className="pt-16 md:pt-24 pb-24">
      <Container>
        {/* Header */}
        <header className="max-w-3xl mb-10 md:mb-14">
          <p className="eyebrow mb-4">{t("eyebrow")}</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">
            {t("title")}
          </h1>
          <p className="lede">{t("subtitle")}</p>
        </header>

        <PublicationStats
          totalPublications={stats.total}
          totalViews={stats.totalViews}
          totalDownloads={stats.totalDownloads}
          totalCitations={0}
          featuredCount={allPublications.filter((p) => p.featured).length}
          typeBreakdown={Object.entries(stats.byType).map(([type, count]) => ({ type, count }))}
        />

        {/* Search & filters */}
        <div className="mb-10 space-y-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <label htmlFor="pub-search" className="sr-only">
                {t("search")}
              </label>
              <Search aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                id="pub-search"
                type="search"
                placeholder={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-11 pl-11 pr-4 bg-navy border border-glass-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="pub-sort" className="eyebrow text-text-muted whitespace-nowrap">
                {t("sort_by")}
              </label>
              <select
                id="pub-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="min-h-11 px-3 text-sm bg-navy border border-glass-border rounded-[var(--radius-md)] text-text-secondary focus:border-gold focus:outline-none"
              >
                <option value="year_desc">{t("sort_year_desc")}</option>
                <option value="year_asc">{t("sort_year_asc")}</option>
                <option value="views">{t("sort_views")}</option>
                <option value="downloads">{t("sort_downloads")}</option>
              </select>
            </div>
          </div>

          <div role="group" aria-label={t("categories")} className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={chip(selectedCategory === cat)}
              >
                {cat === "All" ? t("all") : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div role="group" aria-label={t("year")} className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!selectedYear}
                onClick={() => setSelectedYear(null)}
                className={chip(!selectedYear)}
              >
                {t("all")}
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  aria-pressed={selectedYear === year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(chip(selectedYear === year), "font-mono tabular-nums")}
                >
                  {year}
                </button>
              ))}
            </div>

            {typesPresent.length > 1 && (
              <div role="group" aria-label={t("type_filter")} className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={selectedType === "All"}
                  onClick={() => setSelectedType("All")}
                  className={chip(selectedType === "All")}
                >
                  {t("all_types")}
                </button>
                {typesPresent.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    aria-pressed={selectedType === pt.value}
                    onClick={() => setSelectedType(pt.value)}
                    className={chip(selectedType === pt.value)}
                  >
                    {locale === "fr" ? pt.shortFr : pt.shortEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="eyebrow text-text-muted mb-2" role="status">
          {tTopics("n_publications", { n: filtered.length })}
        </p>

        {/* Index */}
        {filtered.length === 0 ? (
          <p className="py-16 text-text-secondary border-t border-glass-border">{t("no_publications")}</p>
        ) : (
          <ol className="border-t border-glass-border">
            {filtered.map((pub) => {
              const venue = getVenueInfo(pub);
              return (
                <li key={pub.id} className="border-b border-glass-border">
                  <Link
                    href={`/publications/${pub.slug}`}
                    className="group grid grid-cols-[3.5rem_1fr] md:grid-cols-[5rem_1fr_auto] gap-x-4 md:gap-x-8 gap-y-2 py-6 md:py-7 px-2 -mx-2 rounded-[var(--radius-sm)] hover:bg-[var(--hover-wash)] transition-colors"
                  >
                    <span className="font-mono text-sm tabular-nums text-text-muted pt-1">{pub.year}</span>
                    <div className="min-w-0">
                      <h2 className="font-display text-xl md:text-2xl leading-snug text-text-primary group-hover:text-gold transition-colors">
                        {locale === "fr" ? pub.titleFr : pub.title}
                      </h2>
                      <p className="mt-2 text-sm text-text-muted flex flex-wrap gap-x-3 gap-y-1">
                        {pub.category && <span>{pub.category}</span>}
                        <span>{venue && venue !== getTypeLabel(pub) ? venue : getTypeLabel(pub)}</span>
                        {pub.featured && <span className="text-gold">{t("featured")}</span>}
                      </p>
                      <p className="mt-3 text-text-secondary text-[0.95rem] leading-relaxed line-clamp-2 max-w-3xl">
                        {locale === "fr" ? pub.abstractFr : pub.abstract}
                      </p>
                    </div>
                    <div className="col-start-2 md:col-start-auto flex md:flex-col md:items-end gap-3 md:gap-2 text-xs font-mono tabular-nums text-text-muted md:pt-1.5">
                      {pub.accessLevel === "GATED" && (
                        <span className="inline-flex items-center gap-1.5 text-gold">
                          <Lock aria-hidden className="w-3.5 h-3.5" />
                          {t("members_only")}
                        </span>
                      )}
                      {(pub.views || 0) > 0 && (
                        <span>
                          {pub.views} {t("views")}
                        </span>
                      )}
                      {pub.doi && <span>DOI</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </Container>
    </div>
  );
}

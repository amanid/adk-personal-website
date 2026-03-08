"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  Search,
  BookOpen,
  Calendar,
  Users,
  Eye,
  Download,
  Star,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  ExternalLink,
  FileText,
  Lock,
} from "lucide-react";
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
type ViewMode = "list" | "grid";

export default function PublicationsPage() {
  const t = useTranslations("publications");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("year_desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [allPublications, setAllPublications] = useState<Publication[]>(
    staticPublications.map((p) => ({ ...p, publicationType: p.publicationType as PublicationType }))
  );

  useEffect(() => {
    fetch("/api/publications")
      .then((res) => res.json())
      .then((data) => {
        if (data.publications && Array.isArray(data.publications)) {
          const dbPubs: Publication[] = data.publications.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            title: p.title as string,
            titleFr: (p.titleFr as string) || (p.title as string),
            slug: p.slug as string,
            abstract: p.abstract as string,
            abstractFr: (p.abstractFr as string) || (p.abstract as string),
            authors: (p.authors as string[]) || [],
            journal: (p.journal as string) || "",
            year: p.year as number,
            category: (p.category as string) || "",
            pdfUrl: p.pdfUrl as string | undefined,
            tags: (p.tags as string[]) || [],
            featured: (p.featured as boolean) || false,
            views: (p.views as number) || 0,
            downloadCount: (p.downloadCount as number) || 0,
            publicationType: (p.publicationType as PublicationType) || "ANALYTICAL_REPORT",
            doi: p.doi as string | undefined,
            conferenceName: p.conferenceName as string | undefined,
            bookTitle: p.bookTitle as string | undefined,
            institution: p.institution as string | undefined,
          }));

          const staticSlugs = new Set(staticPublications.map((p) => p.slug));
          const newFromDb = dbPubs.filter((p) => !staticSlugs.has(p.slug));
          if (newFromDb.length > 0) {
            setAllPublications((prev) => [...prev, ...newFromDb]);
          }
        }
      })
      .catch(() => {});
  }, []);

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
    <div className="section-padding">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Stats Panel */}
        <PublicationStats
          totalPublications={stats.total}
          totalViews={stats.totalViews}
          totalDownloads={stats.totalDownloads}
          totalCitations={0}
          featuredCount={allPublications.filter((p) => p.featured).length}
          typeBreakdown={Object.entries(stats.byType).map(([type, count]) => ({ type, count }))}
        />

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Publication Type Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType("All")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                selectedType === "All"
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "glass text-text-secondary hover:text-gold"
              }`}
            >
              {t("all_types") || "All Types"}
            </button>
            {PUBLICATION_TYPES.map((pt) => (
              <button
                key={pt.value}
                onClick={() => setSelectedType(pt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  selectedType === pt.value
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "glass text-text-secondary hover:text-gold"
                }`}
              >
                {locale === "fr" ? pt.shortFr : pt.shortEn}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  selectedCategory === cat
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "glass text-text-secondary hover:text-gold"
                }`}
              >
                {cat === "All" ? t("all") : cat}
              </button>
            ))}
          </div>

          {/* Year Filter + Sort + View Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2 flex-1">
              <button
                onClick={() => setSelectedYear(null)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  !selectedYear
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "glass text-text-secondary hover:text-gold"
                }`}
              >
                {t("all")} {t("year")}
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    selectedYear === year
                      ? "bg-gold/20 text-gold border border-gold/30"
                      : "glass text-text-secondary hover:text-gold"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 text-xs bg-navy/50 border border-glass-border rounded-lg text-text-secondary focus:border-gold/50 focus:outline-none"
              >
                <option value="year_desc">{t("sort_year_desc") || "Year (newest)"}</option>
                <option value="year_asc">{t("sort_year_asc") || "Year (oldest)"}</option>
                <option value="views">{t("sort_views") || "Most viewed"}</option>
                <option value="downloads">{t("sort_downloads") || "Most downloaded"}</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex glass rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-gold/20 text-gold" : "text-text-muted hover:text-gold"
                }`}
                title={t("view_list") || "List"}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-gold/20 text-gold" : "text-text-muted hover:text-gold"
                }`}
                title={t("view_grid") || "Grid"}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results count */}
        <p className="text-text-muted text-sm mb-6">
          {filtered.length} {filtered.length === 1 ? "publication" : "publications"}
        </p>

        {/* Publications */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">{t("no_publications")}</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((pub, index) => (
              <motion.div
                key={pub.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  href={`/publications/${pub.slug}`}
                  className="block glass rounded-xl p-5 hover:border-gold/30 transition-all duration-300 group h-full"
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                      {getTypeLabel(pub)}
                    </span>
                    {pub.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                        {pub.category}
                      </span>
                    )}
                    {pub.featured && (
                      <Star className="w-3 h-3 text-gold" />
                    )}
                    {pub.accessLevel === "GATED" && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
                        <Lock className="w-2.5 h-2.5" />
                        Premium
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-semibold mb-2 group-hover:text-gold transition-colors line-clamp-2">
                    {locale === "fr" ? pub.titleFr : pub.title}
                  </h2>
                  <p className="text-text-muted text-xs mb-2">
                    {pub.authors.join(", ")}
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed line-clamp-3 mb-3">
                    {locale === "fr" ? pub.abstractFr : pub.abstract}
                  </p>
                  <div className="mt-auto flex items-center gap-3 text-text-muted text-[10px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {pub.year}
                    </span>
                    {(pub.views || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {pub.views}
                      </span>
                    )}
                    {pub.doi && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        DOI
                      </span>
                    )}
                    {pub.pdfUrl && (
                      <FileText className="w-3 h-3 text-gold" />
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filtered.map((pub, index) => (
              <motion.div
                key={pub.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  href={`/publications/${pub.slug}`}
                  className="block glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium uppercase tracking-wider">
                          {getTypeLabel(pub)}
                        </span>
                        {pub.category && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
                            {pub.category}
                          </span>
                        )}
                        {pub.featured && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold font-medium">
                            <Star className="w-3 h-3 inline -mt-0.5 mr-1" />
                            {t("featured")}
                          </span>
                        )}
                        {pub.accessLevel === "GATED" && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
                            <Lock className="w-2.5 h-2.5" />
                            Premium
                          </span>
                        )}
                        {pub.doi && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                            DOI
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold mb-2 group-hover:text-gold transition-colors">
                        {locale === "fr" ? pub.titleFr : pub.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-text-muted text-sm mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {pub.authors.join(", ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {pub.year}
                        </span>
                        {getVenueInfo(pub) && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {getVenueInfo(pub)}
                          </span>
                        )}
                        {(pub.views || 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {pub.views}
                          </span>
                        )}
                        {(pub.downloadCount || 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" />
                            {pub.downloadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
                        {locale === "fr" ? pub.abstractFr : pub.abstract}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {pub.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-navy-light text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

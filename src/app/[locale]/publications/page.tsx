"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Search, BookOpen, Calendar, Users, Eye } from "lucide-react";
import { publications } from "@/data/publications";

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

export default function PublicationsPage() {
  const t = useTranslations("publications");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const years = useMemo(
    () => [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a),
    []
  );

  const filtered = useMemo(() => {
    return publications.filter((pub) => {
      const title = locale === "fr" ? pub.titleFr : pub.title;
      const matchesSearch =
        !search ||
        title.toLowerCase().includes(search.toLowerCase()) ||
        pub.authors.join(" ").toLowerCase().includes(search.toLowerCase()) ||
        pub.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        selectedCategory === "All" || pub.category === selectedCategory;
      const matchesYear = !selectedYear || pub.year === selectedYear;
      return matchesSearch && matchesCategory && matchesYear;
    });
  }, [search, selectedCategory, selectedYear, locale]);

  return (
    <div className="section-padding">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
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

          <div className="flex flex-wrap gap-2">
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
        </motion.div>

        {/* Results count */}
        <p className="text-text-muted text-sm mb-6">
          {filtered.length} {filtered.length === 1 ? "publication" : "publications"}
        </p>

        {/* Publications Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">{t("no_publications")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((pub, index) => (
              <motion.div
                key={pub.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/publications/${pub.slug}`}
                  className="block glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
                          {pub.category}
                        </span>
                        {pub.featured && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold font-medium">
                            {t("featured")}
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
                        {pub.journal && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {pub.journal}
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

"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Search, Calendar, Eye, ArrowRight, Tag, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { formatDate } from "@/lib/utils";

const POSTS_PER_PAGE = 12;

interface BlogPost {
  id: string;
  title: string;
  titleFr: string | null;
  slug: string;
  excerpt: string | null;
  excerptFr: string | null;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  views: number;
  createdAt: string;
  author: { name: string | null };
}

export default function BlogPage() {
  const t = useTranslations("blog");
  const locale = useLocale();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const estimateReadingTime = (excerpt: string | null) => {
    if (!excerpt) return 1;
    const words = excerpt.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil((words * 5) / 200));
  };

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPosts = posts.filter((post) => {
    const title = locale === "fr" && post.titleFr ? post.titleFr : post.title;
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      category === "all" || post.category === category;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (page - 1) * POSTS_PER_PAGE,
    page * POSTS_PER_PAGE
  );

  const categories = [
    "all",
    ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean))),
  ];

  const blogListJsonLd = useMemo(() => {
    if (posts.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Blog Posts",
      description: "Articles on data science, AI, and statistical analysis",
      url: "https://www.konanamanidieudonne.org/en/blog",
      numberOfItems: posts.length,
      itemListElement: posts.slice(0, 20).map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.konanamanidieudonne.org/en/blog/${post.slug}`,
        name: post.title,
      })),
    };
  }, [posts]);

  return (
    <div className="section-padding">
      {blogListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListJsonLd) }}
        />
      )}
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
          <p className="text-text-secondary text-lg">{t("subtitle")}</p>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("search")}
              className="w-full pl-10 pr-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat as string); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  category === cat
                    ? "bg-gold text-charcoal"
                    : "glass text-text-secondary hover:text-gold"
                }`}
              >
                {cat === "all" ? t("all") : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-20 text-text-secondary">
            <div className="inline-block w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-3" />
            <p>{t("loading") || "Loading..."}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            {t("no_posts")}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="glass rounded-xl overflow-hidden group hover:border-gold/30 transition-all duration-300 block"
                >
                  {post.coverImage ? (
                    <div className="h-40 overflow-hidden relative bg-gradient-to-br from-navy to-navy-light">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-gold/20 font-[family-name:var(--font-display)]">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
                      <span className="text-4xl font-bold text-gold/20 font-[family-name:var(--font-display)]">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {post.category && (
                        <>
                          <Tag className="w-3 h-3 text-gold" />
                          <span className="text-xs text-gold">{post.category}</span>
                        </>
                      )}
                      <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
                        <Clock className="w-3 h-3" />
                        {estimateReadingTime(post.excerpt)} min
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-gold transition-colors line-clamp-2">
                      {locale === "fr" && post.titleFr ? post.titleFr : post.title}
                    </h3>
                    <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                      {locale === "fr" && post.excerptFr
                        ? post.excerptFr
                        : post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-text-muted text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.createdAt, locale)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-gold text-sm">
                      {t("read_more")}
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 glass rounded-lg text-text-secondary hover:text-gold disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    p === page
                      ? "bg-gold text-charcoal font-medium"
                      : "glass text-text-secondary hover:text-gold"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 glass rounded-lg text-text-secondary hover:text-gold disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { formatDate, safeJsonLd } from "@/lib/utils";

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

export default function BlogClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const t = useTranslations("blog");
  const locale = useLocale();
  // Posts are server-rendered; kept in state only for future client refresh needs.
  const [posts] = useState<BlogPost[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const loading = false;
  const [page, setPage] = useState(1);

  const estimateReadingTime = (excerpt: string | null) => {
    if (!excerpt) return 1;
    const words = excerpt.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil((words * 5) / 200));
  };

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
      description: "Articles on data, AI and economics",
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

  const chip = (active: boolean) =>
    cn(
      "inline-flex items-center min-h-11 md:min-h-9 px-3.5 text-sm rounded-[var(--radius-sm)] border transition-colors",
      active
        ? "border-gold/40 bg-gold/10 text-gold"
        : "border-glass-border text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]",
    );

  return (
    <div className="pt-16 md:pt-24 pb-24">
      {blogListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(blogListJsonLd) }}
        />
      )}
      <Container>
        <header className="max-w-3xl mb-10 md:mb-14">
          <p className="eyebrow mb-4">{t("eyebrow")}</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
          <p className="lede">{t("subtitle")}</p>
        </header>

        {/* Search & filter */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="relative max-w-xl">
            <label htmlFor="blog-search" className="sr-only">
              {t("search")}
            </label>
            <Search aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="blog-search"
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("search")}
              className="w-full min-h-11 pl-11 pr-4 bg-navy border border-glass-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors"
            />
          </div>
          {categories.length > 1 && (
            <div role="group" aria-label={t("categories")} className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat}
                  onClick={() => { setCategory(cat as string); setPage(1); }}
                  className={chip(category === cat)}
                >
                  {cat === "all" ? t("all") : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p role="status" className="py-16 text-text-secondary">{t("loading")}</p>
        ) : filteredPosts.length === 0 ? (
          <p className="py-16 text-text-secondary border-t border-glass-border">{t("no_posts")}</p>
        ) : (
          <>
            <ol className="border-t border-glass-border">
              {paginatedPosts.map((post) => (
                <li key={post.id} className="border-b border-glass-border">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group grid grid-cols-1 md:grid-cols-[8rem_1fr_10rem] gap-x-8 gap-y-2 py-7 px-2 -mx-2 rounded-[var(--radius-sm)] hover:bg-[var(--hover-wash)] transition-colors"
                  >
                    <span className="font-mono text-sm tabular-nums text-text-muted md:pt-1.5">
                      {formatDate(post.createdAt, locale)}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-2xl leading-snug group-hover:text-gold transition-colors">
                        {locale === "fr" && post.titleFr ? post.titleFr : post.title}
                      </span>
                      {(post.excerpt || post.excerptFr) && (
                        <span className="block mt-2 text-text-secondary leading-relaxed line-clamp-2 max-w-2xl">
                          {locale === "fr" && post.excerptFr ? post.excerptFr : post.excerpt}
                        </span>
                      )}
                      <span className="flex flex-wrap gap-x-3 mt-3 text-sm text-text-muted">
                        {post.category && <span>{post.category}</span>}
                        <span className="font-mono tabular-nums">
                          {estimateReadingTime(post.excerpt)} {t("reading_time")}
                        </span>
                      </span>
                    </span>
                    {post.coverImage ? (
                      <span className="hidden md:block aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] bg-navy">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.coverImage}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </span>
                    ) : (
                      <span className="hidden md:block" />
                    )}
                  </Link>
                </li>
              ))}
            </ol>

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2 mt-10">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  aria-label={locale === "fr" ? "Page précédente" : "Previous page"}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-glass-border text-text-secondary hover:text-gold disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft aria-hidden className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(
                      "w-11 h-11 rounded-[var(--radius-sm)] font-mono text-sm tabular-nums transition-colors",
                      p === page
                        ? "bg-gold text-charcoal"
                        : "border border-glass-border text-text-secondary hover:text-gold",
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  aria-label={locale === "fr" ? "Page suivante" : "Next page"}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-glass-border text-text-secondary hover:text-gold disabled:opacity-30 transition-colors"
                >
                  <ChevronRight aria-hidden className="w-4 h-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

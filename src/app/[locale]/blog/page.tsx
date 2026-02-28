"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Search, Calendar, Eye, ArrowRight, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

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

  const categories = [
    "all",
    ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean))),
  ];

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
          <p className="text-text-secondary text-lg">{t("subtitle")}</p>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full pl-10 pr-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat as string)}
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
          <div className="text-center py-20 text-text-secondary">{t("search")}...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            {t("no_posts")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
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
                  <div className="h-40 bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
                    <span className="text-4xl font-bold text-gold/20 font-[family-name:var(--font-display)]">
                      {post.title.charAt(0)}
                    </span>
                  </div>
                  <div className="p-5">
                    {post.category && (
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-3 h-3 text-gold" />
                        <span className="text-xs text-gold">{post.category}</span>
                      </div>
                    )}
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
        )}
      </div>
    </div>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Calendar, Eye, ArrowLeft, User, Send, Clock, Share2, Check, List } from "lucide-react";
import { useState, useEffect, use, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface BlogPostFull {
  id: string;
  title: string;
  titleFr: string | null;
  slug: string;
  content: string;
  contentFr: string | null;
  excerpt: string | null;
  category: string | null;
  tags: string[];
  views: number;
  createdAt: string;
  author: { name: string | null };
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string | null };
  }[];
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("blog");
  const locale = useLocale();
  const { data: session } = useSession();
  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<{ slug: string; title: string; titleFr: string | null }[]>([]);
  const [showToc, setShowToc] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data.post);
        setLoading(false);
        if (data.post?.category) {
          fetch(`/api/blog?category=${data.post.category}&limit=4`)
            .then((r) => r.json())
            .then((d) => {
              const related = (d.posts || [])
                .filter((p: { slug: string }) => p.slug !== slug)
                .slice(0, 3);
              setRelatedPosts(related);
            })
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const submitComment = async () => {
    if (!comment.trim() || !post) return;
    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });
      if (res.ok) {
        const data = await res.json();
        setPost({
          ...post,
          comments: [...post.comments, data.comment],
        });
        setComment("");
      }
    } catch {
      // handle silently
    }
  };

  const title = post
    ? locale === "fr" && post.titleFr
      ? post.titleFr
      : post.title
    : "";
  const content = post
    ? locale === "fr" && post.contentFr
      ? post.contentFr
      : post.content
    : "";

  const readingTime = useMemo(() => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [content]);

  const tocItems = useMemo(() => {
    if (!content) return [];
    const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
    const items: { level: number; text: string; id: string }[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, "");
      const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      items.push({ level: parseInt(match[1]), text, id });
    }
    return items;
  }, [content]);

  const contentWithIds = useMemo(() => {
    if (!content) return "";
    return content.replace(/<h([23])([^>]*)>(.*?)<\/h([23])>/gi, (match, level, attrs, text) => {
      const plainText = text.replace(/<[^>]*>/g, "");
      const id = plainText.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });
  }, [content]);

  if (loading) {
    return (
      <div className="section-padding text-center text-text-secondary">
        <div className="inline-block w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-3" />
        <p>{t("loading") || "Loading..."}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="section-padding text-center">
        <h1 className="text-2xl font-bold mb-4">{t("not_found") || "Post not found"}</h1>
        <Link href="/blog" className="text-gold hover:text-gold-light">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          {t("title")}
        </Link>
      </div>
    );
  }

  const shareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    author: { "@type": "Person", name: post.author.name },
    datePublished: post.createdAt,
    articleSection: post.category || undefined,
    wordCount: content.replace(/<[^>]*>/g, "").split(/\s+/).length,
  };

  return (
    <div className="section-padding">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-gold mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("title")}
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {post.category && (
            <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
              {post.category}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] mt-4 mb-4">
            {title}
          </h1>
          <div className="flex items-center flex-wrap gap-4 text-text-muted text-sm mb-4">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {post.author.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.createdAt, locale)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.views}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readingTime} {t("reading_time")}
            </span>
            <button
              onClick={shareUrl}
              className="flex items-center gap-1 hover:text-gold transition-colors ml-auto"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
              {copied ? t("copied") || "Copied!" : t("share") || "Share"}
            </button>
          </div>

          {/* Table of Contents */}
          {tocItems.length > 0 && (
            <div className="glass rounded-lg p-4 mb-8">
              <button
                onClick={() => setShowToc(!showToc)}
                className="flex items-center gap-2 text-sm font-medium text-text-primary w-full"
              >
                <List className="w-4 h-4 text-gold" />
                {t("toc") || "Table of Contents"}
                <span className="text-text-muted text-xs ml-auto">
                  {showToc ? "−" : "+"}
                </span>
              </button>
              {showToc && (
                <nav className="mt-3 space-y-1">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm hover:text-gold transition-colors ${
                        item.level === 3 ? "pl-4 text-text-muted" : "text-text-secondary"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          )}

          <div
            className="prose prose-invert prose-gold max-w-none mb-12 text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 border-t border-glass-border pt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full glass text-text-secondary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-glass-border pt-8">
            <h3 className="text-xl font-semibold mb-6">
              {t("comments")} ({post.comments.length})
            </h3>

            {post.comments.map((c) => (
              <div key={c.id} className="glass rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium">{c.author.name}</span>
                  <span className="text-text-muted text-xs">
                    {formatDate(c.createdAt, locale)}
                  </span>
                </div>
                <p className="text-text-secondary text-sm">{c.content}</p>
              </div>
            ))}

            {session ? (
              <div className="mt-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("leave_comment")}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors resize-none mb-3"
                />
                <button
                  onClick={submitComment}
                  disabled={!comment.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all disabled:opacity-50 text-sm"
                >
                  <Send className="w-3 h-3" />
                  {t("post_comment")}
                </button>
              </div>
            ) : (
              <p className="text-text-muted text-sm mt-4">
                <Link href="/auth/login" className="text-gold hover:text-gold-light">
                  {t("login_to_comment")}
                </Link>
              </p>
            )}
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="border-t border-glass-border pt-8 mt-8">
              <h3 className="text-xl font-semibold mb-4">{t("related") || "Related Posts"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/blog/${rp.slug}`}
                    className="glass rounded-lg p-4 hover:border-gold/30 transition-all group"
                  >
                    <h4 className="text-sm font-medium group-hover:text-gold transition-colors line-clamp-2">
                      {locale === "fr" && rp.titleFr ? rp.titleFr : rp.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.article>
      </div>
    </div>
  );
}

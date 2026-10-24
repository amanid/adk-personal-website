"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Share2, Check, ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useState, use, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import BlogJsonLd from "@/components/blog/BlogJsonLd";
import ShareBar from "@/components/blog/ShareBar";
import CTABanner from "@/components/CTABanner";
import NewsletterSignup from "@/components/NewsletterSignup";
import PromoCard from "@/components/promo/PromoCard";
import type { PromoSet } from "@/lib/promos";

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

export interface RelatedPost {
  slug: string;
  title: string;
  titleFr: string | null;
}

export default function BlogDetailClient({
  params,
  initialPost = null,
  initialRelated = [],
  promos,
}: {
  params: Promise<{ slug: string }>;
  initialPost?: BlogPostFull | null;
  initialRelated?: RelatedPost[];
  /** House ads chosen for this post by lib/promos: one title to buy, one report to read. */
  promos?: PromoSet;
}) {
  const { slug } = use(params);
  const t = useTranslations("blog");
  const locale = useLocale();
  const { data: session } = useSession();
  // Post is server-rendered; kept in state so comments can be appended.
  const [post, setPost] = useState<BlogPostFull | null>(initialPost);
  const [comment, setComment] = useState("");
  const loading = false;
  const [copied, setCopied] = useState(false);
  const [relatedPosts] = useState<RelatedPost[]>(initialRelated);
  const [showToc, setShowToc] = useState(false);
  const [sending, setSending] = useState(false);

  const submitComment = async () => {
    if (!comment.trim() || !post) return;
    setSending(true);
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
    } finally {
      setSending(false);
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
      <Container size="prose" className="pt-16 md:pt-24 pb-24">
        <p role="status" className="text-text-secondary">{t("loading")}</p>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container size="prose" className="pt-16 md:pt-24 pb-24">
        <h1 className="font-display text-3xl md:text-4xl mb-6">{t("not_found")}</h1>
        <ButtonLink href="/blog" variant="secondary">
          <ArrowLeft aria-hidden className="w-4 h-4" />
          {t("title")}
        </ButtonLink>
      </Container>
    );
  }

  const shareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-12 md:pt-20 pb-24">
      <BlogJsonLd
        title={title}
        description={post.excerpt || title}
        slug={post.slug}
        publishedAt={post.createdAt}
        authorName={post.author.name || "KONAN Amani Dieudonné"}
        tags={post.tags}
      />
      <Container size="prose">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 min-h-11 text-sm text-text-secondary hover:text-gold mb-8 transition-colors"
        >
          <ArrowLeft aria-hidden className="w-4 h-4" />
          {t("title")}
        </Link>

        <article>
          <header className="mb-10">
            {post.category && <p className="eyebrow mb-4">{post.category}</p>}
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight mb-6">{title}</h1>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-text-muted text-sm">
              {post.author.name && <span className="text-text-secondary">{post.author.name}</span>}
              <span aria-hidden>·</span>
              <time dateTime={post.createdAt} className="font-mono tabular-nums">
                {formatDate(post.createdAt, locale)}
              </time>
              <span aria-hidden>·</span>
              <span className="font-mono tabular-nums">
                {readingTime} {t("reading_time")}
              </span>
              <button
                type="button"
                onClick={shareUrl}
                className="inline-flex items-center gap-1.5 min-h-11 px-2 -mr-2 ml-auto hover:text-gold transition-colors"
              >
                {copied ? <Check aria-hidden className="w-4 h-4 text-success" /> : <Share2 aria-hidden className="w-4 h-4" />}
                <span role="status">{copied ? t("copied") : t("share")}</span>
              </button>
            </div>
          </header>

          {/* Table of contents */}
          {tocItems.length > 0 && (
            <nav aria-label={t("toc")} className="border-y border-glass-border mb-10">
              <button
                type="button"
                onClick={() => setShowToc(!showToc)}
                aria-expanded={showToc}
                className="flex items-center gap-2 min-h-11 py-2 w-full text-left"
              >
                <span className="eyebrow">{t("toc")}</span>
                <ChevronDown
                  aria-hidden
                  className={`w-4 h-4 ml-auto text-text-muted transition-transform ${showToc ? "rotate-180" : ""}`}
                />
              </button>
              {showToc && (
                <ol className="pb-4 space-y-1">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block py-1 hover:text-gold transition-colors ${
                          item.level === 3 ? "pl-5 text-sm text-text-muted" : "text-text-secondary"
                        }`}
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </nav>
          )}

          <div
            className="prose max-w-none mb-12 text-text-secondary text-[1.0625rem] leading-[1.75]"
            dangerouslySetInnerHTML={{ __html: contentWithIds }}
          />

          {post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-2 mb-10 pt-6 border-t border-glass-border font-mono text-sm text-text-muted">
              {post.tags.map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          )}

          <ShareBar title={title} slug={post.slug} />

          {promos?.books[0] && <PromoCard item={promos.books[0]} placement="blog-article" />}
          {promos?.publications[0] && <PromoCard item={promos.publications[0]} placement="blog-reading" />}

          <CTABanner variant="consulting" />
          <NewsletterSignup variant="inline" />

          {/* Comments */}
          <section aria-labelledby="blog-comments" className="hairline pt-10 mt-4">
            <h2 id="blog-comments" className="font-display text-2xl mb-6">
              {t("comments")} <span className="font-mono text-base text-text-muted tabular-nums">({post.comments.length})</span>
            </h2>

            {post.comments.length > 0 && (
              <ul className="mb-8 border-t border-glass-border">
                {post.comments.map((c) => (
                  <li key={c.id} className="py-4 border-b border-glass-border">
                    <p className="text-sm mb-1.5">
                      <span className="font-medium text-text-primary">{c.author.name}</span>
                      <span className="font-mono text-xs text-text-muted ml-3">{formatDate(c.createdAt, locale)}</span>
                    </p>
                    <p className="text-text-secondary">{c.content}</p>
                  </li>
                ))}
              </ul>
            )}

            {session ? (
              <div>
                <label htmlFor="blog-comment" className="block text-sm text-text-secondary mb-2">
                  {t("leave_comment")}
                </label>
                <textarea
                  id="blog-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full min-h-11 px-4 py-3 bg-navy border border-glass-border rounded-[var(--radius-md)] text-text-primary focus:border-gold focus:outline-none transition-colors resize-y mb-3"
                />
                <Button type="button" onClick={submitComment} loading={sending} disabled={!comment.trim()}>
                  {t("post_comment")}
                </Button>
              </div>
            ) : (
              <p className="text-text-secondary">
                <Link href="/auth/login" className="text-gold hover:text-gold-light underline underline-offset-4">
                  {t("login_to_comment")}
                </Link>
              </p>
            )}
          </section>

          {relatedPosts.length > 0 && (
            <section aria-labelledby="blog-related" className="hairline pt-10 mt-12">
              <h2 id="blog-related" className="font-display text-2xl mb-4">
                {t("related")}
              </h2>
              <ul className="border-t border-glass-border">
                {relatedPosts.map((rp) => (
                  <li key={rp.slug} className="border-b border-glass-border">
                    <Link
                      href={`/blog/${rp.slug}`}
                      className="flex items-center min-h-11 py-3 font-display text-lg leading-snug hover:text-gold transition-colors"
                    >
                      {locale === "fr" && rp.titleFr ? rp.titleFr : rp.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </Container>
    </div>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Calendar, Eye, ArrowLeft, User, Send } from "lucide-react";
import { useState, useEffect, use } from "react";
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

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data.post);
        setLoading(false);
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

  if (loading) {
    return (
      <div className="section-padding text-center text-text-secondary">
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="section-padding text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link href="/blog" className="text-gold hover:text-gold-light">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          {t("title")}
        </Link>
      </div>
    );
  }

  const title = locale === "fr" && post.titleFr ? post.titleFr : post.title;
  const content =
    locale === "fr" && post.contentFr ? post.contentFr : post.content;

  return (
    <div className="section-padding">
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
          <div className="flex items-center gap-4 text-text-muted text-sm mb-8">
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
          </div>

          <div
            className="prose prose-invert prose-gold max-w-none mb-12 text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
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
        </motion.article>
      </div>
    </div>
  );
}

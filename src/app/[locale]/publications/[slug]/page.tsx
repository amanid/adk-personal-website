"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Users,
  Download,
  Eye,
  MessageSquare,
} from "lucide-react";
import { publications } from "@/data/publications";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string | null };
}

interface DbPublication {
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
  tags: string[];
  featured: boolean;
  views: number;
  comments: Comment[];
}

export default function PublicationDetailPage() {
  const params = useParams();
  const t = useTranslations("publications");
  const locale = useLocale();
  const { data: session } = useSession();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dbPub, setDbPub] = useState<DbPublication | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const slug = params.slug as string;

  // Try to find in static data first
  const staticPub = publications.find((p) => p.slug === slug);

  // Also fetch from database (for DB-only publications and for comments/views)
  useEffect(() => {
    fetch(`/api/publications/${slug}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.publication) {
          setDbPub(data.publication);
          setComments(data.publication.comments || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // Use static data if available, otherwise use DB data
  const pub = staticPub || dbPub;

  if (!pub && loading) {
    return (
      <div className="section-padding text-center text-text-secondary">
        <div className="inline-block w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-3" />
        <p>{t("loading") || "Loading..."}</p>
      </div>
    );
  }

  if (!pub) {
    return (
      <div className="section-padding text-center">
        <p className="text-text-secondary">Publication not found.</p>
        <Link
          href="/publications"
          className="text-gold hover:text-gold-light mt-4 inline-block"
        >
          {t("back_to_list")}
        </Link>
      </div>
    );
  }

  const title = locale === "fr" ? (pub.titleFr || pub.title) : pub.title;
  const abstract = locale === "fr" ? (pub.abstractFr || pub.abstract) : pub.abstract;
  const pdfUrl = pub.pdfUrl;
  const views = dbPub?.views;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/publications/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data.comment]);
        setCommentText("");
      }
    } catch {
      // Handle error silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/publications"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back_to_list")}
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
              {pub.category}
            </span>
            {pub.featured && (
              <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold font-medium">
                {t("featured")}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] mb-6">
            {title}
          </h1>

          {/* Meta info */}
          <div className="glass rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    {t("authors")}
                  </p>
                  <p className="text-text-primary text-sm">
                    {pub.authors.join(", ")}
                  </p>
                </div>
              </div>
              {pub.journal && (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      {t("journal")}
                    </p>
                    <p className="text-text-primary text-sm">{pub.journal}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    {t("year")}
                  </p>
                  <p className="text-text-primary text-sm">{pub.year}</p>
                </div>
              </div>
              {views !== undefined && views > 0 && (
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      {t("views") || "Views"}
                    </p>
                    <p className="text-text-primary text-sm">{views}</p>
                  </div>
                </div>
              )}
              {pdfUrl && (
                <div className="flex items-center">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium text-sm rounded-lg hover:bg-gold-light transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {t("download_pdf")}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Abstract */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold font-[family-name:var(--font-display)] text-gold mb-4">
              {t("abstract")}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {abstract}
            </p>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
              {t("tags")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {pub.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-3 py-1 rounded-lg glass text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-glass-border pt-8">
            <h2 className="text-xl font-semibold font-[family-name:var(--font-display)] mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              {t("comments")} ({comments.length})
            </h2>

            {comments.map((c) => (
              <div key={c.id} className="glass rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{c.author.name}</span>
                  <span className="text-text-muted text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-text-secondary text-sm">{c.content}</p>
              </div>
            ))}

            {session ? (
              <form onSubmit={handleComment} className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("leave_comment")}
                  rows={3}
                  className="w-full px-4 py-3 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors resize-none mb-3"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="px-6 py-2 bg-gold text-charcoal font-medium text-sm rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {submitting ? "..." : t("post_comment")}
                </button>
              </form>
            ) : (
              <p className="text-text-muted text-sm glass rounded-lg p-4 mb-6">
                {t("login_to_comment")}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

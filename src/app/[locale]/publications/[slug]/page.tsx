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
  ExternalLink,
  FileText,
  Tag,
  Building2,
  User,
} from "lucide-react";
import { publications } from "@/data/publications";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getPublicationTypeLabel } from "@/lib/publication-types";
import CitationExport from "@/components/publications/CitationExport";
import PdfViewer from "@/components/publications/PdfViewer";
import ShareButtons from "@/components/publications/ShareButtons";
import type { PublicationType, PublicationData } from "@/types";

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
  publicationType?: string;
  doi?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  publisherFr?: string;
  conferenceName?: string;
  conferenceNameFr?: string;
  conferenceLocation?: string;
  bookTitle?: string;
  bookTitleFr?: string;
  institution?: string;
  institutionFr?: string;
  month?: number;
  url?: string;
  downloadCount?: number;
  citationCount?: number;
}

interface RelatedPub {
  slug: string;
  title: string;
  titleFr?: string;
  year: number;
  publicationType?: string;
  authors: string[];
  category?: string;
  tags?: string[];
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
  const [related, setRelated] = useState<RelatedPub[]>([]);
  const [showPdf, setShowPdf] = useState(false);

  const slug = params.slug as string;
  const staticPub = publications.find((p) => p.slug === slug);

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

    // Fetch related publications
    fetch("/api/publications")
      .then((res) => res.json())
      .then((data) => {
        if (data.publications) {
          const currentCategory = staticPub?.category;
          const currentTags = new Set(staticPub?.tags || []);
          const others = (data.publications as RelatedPub[])
            .filter((p) => p.slug !== slug)
            .map((p) => ({
              ...p,
              score:
                (p.category === currentCategory ? 3 : 0) +
                (p.tags || []).filter((t: string) => currentTags.has(t)).length,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);
          setRelated(others);
        }
      })
      .catch(() => {});
  }, [slug, staticPub?.category, staticPub?.tags]);

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
        <Link href="/publications" className="text-gold hover:text-gold-light mt-4 inline-block">
          {t("back_to_list")}
        </Link>
      </div>
    );
  }

  const title = locale === "fr" ? (pub.titleFr || pub.title) : pub.title;
  const abstract = locale === "fr" ? (pub.abstractFr || pub.abstract) : pub.abstract;
  const pdfUrl = pub.pdfUrl;
  const views = dbPub?.views;
  const downloads = dbPub?.downloadCount || 0;
  const pubType = (dbPub?.publicationType || (staticPub as PublicationData | undefined)?.publicationType || "ANALYTICAL_REPORT") as PublicationType;
  const doi = dbPub?.doi || (staticPub as PublicationData | undefined)?.doi;
  const volume = dbPub?.volume;
  const issue = dbPub?.issue;
  const pages = dbPub?.pages;
  const publisher = dbPub?.publisher;
  const conferenceName = locale === "fr" ? (dbPub?.conferenceNameFr || dbPub?.conferenceName) : dbPub?.conferenceName;
  const conferenceLocation = dbPub?.conferenceLocation;
  const bookTitle = locale === "fr" ? (dbPub?.bookTitleFr || dbPub?.bookTitle) : dbPub?.bookTitle;
  const institution = locale === "fr" ? (dbPub?.institutionFr || dbPub?.institution) : dbPub?.institution;
  const citationCount = dbPub?.citationCount;

  const trackDownload = () => {
    fetch(`/api/publications/${slug}/download`, { method: "POST" }).catch(() => {});
  };

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
      // Handle silently
    } finally {
      setSubmitting(false);
    }
  };

  // Structured data for Google Scholar
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: pub.title,
    author: pub.authors.map((a) => ({ "@type": "Person", name: a })),
    datePublished: `${pub.year}${dbPub?.month ? `-${String(dbPub.month).padStart(2, "0")}` : ""}`,
    ...(pub.journal && { isPartOf: { "@type": "Periodical", name: pub.journal } }),
    ...(doi && { identifier: { "@type": "PropertyValue", propertyID: "DOI", value: doi } }),
    ...(pub.abstract && { description: pub.abstract }),
    ...(pub.pdfUrl && { url: pub.pdfUrl }),
  };

  return (
    <div className="section-padding">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link href="/publications" className="inline-flex items-center gap-2 text-text-secondary hover:text-gold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("back_to_list")}
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Type & Category Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-semibold uppercase tracking-wider">
              {getPublicationTypeLabel(pubType, locale)}
            </span>
            {pub.category && (
              <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
                {pub.category}
              </span>
            )}
            {pub.featured && (
              <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold font-medium">
                {t("featured")}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] mb-6">
            {title}
          </h1>

          {/* Meta info card */}
          <div className="glass rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Authors */}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("authors")}</p>
                  <p className="text-text-primary text-sm">{pub.authors.join(", ")}</p>
                </div>
              </div>

              {/* Journal / Venue */}
              {pub.journal && (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("journal")}</p>
                    <p className="text-text-primary text-sm">
                      {pub.journal}
                      {volume && `, Vol. ${volume}`}
                      {issue && `, No. ${issue}`}
                      {pages && `, pp. ${pages}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Conference */}
              {conferenceName && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("conference") || "Conference"}</p>
                    <p className="text-text-primary text-sm">
                      {conferenceName}
                      {conferenceLocation && ` - ${conferenceLocation}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Book Title */}
              {bookTitle && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("book") || "Book"}</p>
                    <p className="text-text-primary text-sm">{bookTitle}</p>
                  </div>
                </div>
              )}

              {/* Institution */}
              {institution && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("institution") || "Institution"}</p>
                    <p className="text-text-primary text-sm">{institution}</p>
                  </div>
                </div>
              )}

              {/* Publisher */}
              {publisher && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("publisher") || "Publisher"}</p>
                    <p className="text-text-primary text-sm">{publisher}</p>
                  </div>
                </div>
              )}

              {/* Year */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("year")}</p>
                  <p className="text-text-primary text-sm">{pub.year}</p>
                </div>
              </div>

              {/* DOI */}
              {doi && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">DOI</p>
                    <a
                      href={`https://doi.org/${doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-gold-light text-sm transition-colors"
                    >
                      {doi}
                    </a>
                  </div>
                </div>
              )}

              {/* Stats Row */}
              <div className="flex items-center gap-6 md:col-span-2 pt-2 border-t border-glass-border">
                {views !== undefined && (
                  <span className="flex items-center gap-1.5 text-text-muted text-sm">
                    <Eye className="w-4 h-4" />
                    {views} {t("views")}
                  </span>
                )}
                {downloads > 0 && (
                  <span className="flex items-center gap-1.5 text-text-muted text-sm">
                    <Download className="w-4 h-4" />
                    {downloads} {t("downloads") || "downloads"}
                  </span>
                )}
                {citationCount !== undefined && citationCount !== null && citationCount > 0 && (
                  <span className="flex items-center gap-1.5 text-text-muted text-sm">
                    <BookOpen className="w-4 h-4" />
                    {citationCount} citations
                  </span>
                )}
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackDownload}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium text-sm rounded-lg hover:bg-gold-light transition-colors ml-auto"
                  >
                    <Download className="w-4 h-4" />
                    {t("download_pdf")}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mb-6">
            <ShareButtons
              title={pub.title}
              url={`/publications/${pub.slug}`}
              doi={doi}
            />
          </div>

          {/* Citation Export */}
          <div className="mb-8">
            <CitationExport
              publication={{
                id: pub.id || slug,
                title: pub.title,
                titleFr: pub.titleFr || pub.title,
                abstract: pub.abstract,
                abstractFr: pub.abstractFr || pub.abstract,
                authors: pub.authors,
                year: pub.year,
                journal: pub.journal || "",
                category: pub.category || "",
                slug: pub.slug,
                tags: pub.tags || [],
                featured: pub.featured || false,
                publicationType: pubType,
                doi,
                volume,
                issue,
                pages,
                publisher,
                conferenceName: dbPub?.conferenceName || undefined,
                bookTitle: dbPub?.bookTitle || undefined,
                institution: dbPub?.institution || undefined,
                month: dbPub?.month || undefined,
                url: dbPub?.url || undefined,
                pdfUrl: pub.pdfUrl || undefined,
              }}
            />
          </div>

          {/* Abstract */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold font-[family-name:var(--font-display)] text-gold mb-4">
              {t("abstract")}
            </h2>
            <p className="text-text-secondary leading-relaxed">{abstract}</p>
          </div>

          {/* PDF Viewer */}
          {pdfUrl && (
            <div className="mb-8">
              <button
                onClick={() => setShowPdf(!showPdf)}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-gold transition-colors mb-3"
              >
                <FileText className="w-4 h-4" />
                {showPdf ? "Hide PDF" : "View PDF"}
              </button>
              {showPdf && (
                <PdfViewer url={pdfUrl} title={title} />
              )}
            </div>
          )}

          {/* Tags */}
          {pub.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {t("tags")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {pub.tags.map((tag) => (
                  <span key={tag} className="text-sm px-3 py-1 rounded-lg glass text-text-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Publications */}
          {related.length > 0 && (
            <div className="mb-8 border-t border-glass-border pt-8">
              <h2 className="text-xl font-semibold font-[family-name:var(--font-display)] mb-4">
                {t("related") || "Related Publications"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {related.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/publications/${rp.slug}`}
                    className="glass rounded-lg p-4 hover:border-gold/30 transition-all group"
                  >
                    {rp.publicationType && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium uppercase tracking-wider">
                        {getPublicationTypeLabel(rp.publicationType as PublicationType, locale)}
                      </span>
                    )}
                    <h4 className="text-sm font-medium group-hover:text-gold transition-colors line-clamp-2 mt-1">
                      {locale === "fr" && rp.titleFr ? rp.titleFr : rp.title}
                    </h4>
                    <p className="text-text-muted text-xs mt-1">
                      {rp.authors?.slice(0, 2).join(", ")} - {rp.year}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t border-glass-border pt-8">
            <h2 className="text-xl font-semibold font-[family-name:var(--font-display)] mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              {t("comments")} ({comments.length})
            </h2>

            {comments.map((c) => (
              <div key={c.id} className="glass rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gold" />
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

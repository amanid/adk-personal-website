"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { safeJsonLd, slugify } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Download, FileText, Lock } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { publications } from "@/data/publications";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getPublicationTypeLabel } from "@/lib/publication-types";
import CitationExport from "@/components/publications/CitationExport";
import PdfViewer from "@/components/publications/PdfViewer";
import ShareButtons from "@/components/publications/ShareButtons";
import type { PublicationType, PublicationData } from "@/types";
import CTABanner from "@/components/CTABanner";
import NewsletterSignup from "@/components/NewsletterSignup";
import PromoStrip from "@/components/promo/PromoStrip";
import type { PromoItem } from "@/lib/promos";
import SubscriptionGate from "@/components/publications/SubscriptionGate";

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
  dataUrl?: string | null;
  supplementaryUrl?: string | null;
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

export interface RelatedPub {
  slug: string;
  title: string;
  titleFr?: string;
  year: number;
  publicationType?: string;
  authors: string[];
  category?: string;
  tags?: string[];
}

export default function PublicationDetailClient({
  initialRelated = [],
  promoBooks = [],
}: {
  initialRelated?: RelatedPub[];
  /** Bookstore titles on the same questions, chosen by lib/promos. */
  promoBooks?: PromoItem[];
}) {
  const params = useParams();
  const t = useTranslations("publications");
  const tPromo = useTranslations("promo");
  const locale = useLocale();
  const { data: session } = useSession();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dbPub, setDbPub] = useState<DbPublication | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  // Related is computed server-side (avoids refetching the whole corpus here).
  const [related] = useState<RelatedPub[]>(initialRelated);
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
  }, [slug]);

  const pub = staticPub || dbPub;

  if (!pub && loading) {
    return (
      <Container size="prose" className="pt-16 md:pt-24 pb-24 text-text-secondary">
        <p role="status" className="flex items-center gap-3">
          <span aria-hidden className="inline-block w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          {t("loading")}
        </p>
      </Container>
    );
  }

  if (!pub) {
    return (
      <Container size="prose" className="pt-16 md:pt-24 pb-24">
        <p className="text-text-secondary mb-6">{t("no_publications")}</p>
        <ButtonLink href="/publications" variant="secondary">
          {t("back_to_list")}
        </ButtonLink>
      </Container>
    );
  }

  const title = locale === "fr" ? (pub.titleFr || pub.title) : pub.title;
  const abstract = locale === "fr" ? (pub.abstractFr || pub.abstract) : pub.abstract;
  const pdfUrl = pub.pdfUrl;
  // Data files arrive already rewritten to the access-checked route (protectFiles).
  const dataUrl = dbPub?.dataUrl || (staticPub as PublicationData | undefined)?.dataUrl || null;
  const supplementaryUrl = dbPub?.supplementaryUrl || (staticPub as PublicationData | undefined)?.supplementaryUrl || null;
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
  // The server's verdict (DB access level) wins; the static catalogue is the fallback.
  const accessLevel =
    (dbPub as { accessLevel?: string } | null)?.accessLevel === "GATED"
      ? "GATED"
      : (staticPub as PublicationData | undefined)?.accessLevel || "FREE";

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

  // Structured data. Analytical and technical reports are typed as Report,
  // not ScholarlyArticle, so search engines are not told they are papers.
  const isReport = pubType === "ANALYTICAL_REPORT" || pubType === "TECHNICAL_REPORT";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isReport ? "Report" : "ScholarlyArticle",
    headline: pub.title,
    author: pub.authors.map((a) => ({ "@type": "Person", name: a })),
    datePublished: `${pub.year}${dbPub?.month ? `-${String(dbPub.month).padStart(2, "0")}` : ""}`,
    ...(pub.journal && { isPartOf: { "@type": "Periodical", name: pub.journal } }),
    ...(doi && { identifier: { "@type": "PropertyValue", propertyID: "DOI", value: doi } }),
    ...(pub.abstract && { description: pub.abstract }),
    ...(pub.pdfUrl && { url: pub.pdfUrl }),
  };

  const venue = [
    pub.journal,
    volume && `Vol. ${volume}`,
    issue && `No. ${issue}`,
    pages && `pp. ${pages}`,
  ]
    .filter(Boolean)
    .join(", ");
  const typeLabel = getPublicationTypeLabel(pubType, locale);
  const details: { label: string; value: React.ReactNode }[] = [
    { label: t("authors"), value: pub.authors.join(", ") },
    { label: t("year"), value: <span className="font-mono tabular-nums">{pub.year}</span> },
    ...(venue && pub.journal !== typeLabel ? [{ label: t("journal"), value: venue }] : []),
    ...(conferenceName
      ? [{ label: t("conference"), value: `${conferenceName}${conferenceLocation ? `, ${conferenceLocation}` : ""}` }]
      : []),
    ...(bookTitle ? [{ label: t("book"), value: bookTitle }] : []),
    ...(institution ? [{ label: t("institution"), value: institution }] : []),
    ...(publisher ? [{ label: t("publisher"), value: publisher }] : []),
    ...(doi
      ? [
          {
            label: "DOI",
            value: (
              <a
                href={`https://doi.org/${doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-light underline underline-offset-4 break-all"
              >
                {doi}
              </a>
            ),
          },
        ]
      : []),
  ];

  return (
    <article className="pt-12 md:pt-20 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <Container size="prose">
        <Link
          href="/publications"
          className="inline-flex items-center gap-2 min-h-11 text-sm text-text-secondary hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft aria-hidden className="w-4 h-4" />
          {t("back_to_list")}
        </Link>

        {/* Header */}
        <header className="mb-10">
          <p className="eyebrow mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>{typeLabel}</span>
            {pub.category && (
              <>
                <span aria-hidden className="text-text-muted">/</span>
                <Link href={`/topics/${slugify(pub.category)}`} className="hover:text-gold-light underline-offset-4 hover:underline">
                  {pub.category}
                </Link>
              </>
            )}
            {pub.featured && (
              <>
                <span aria-hidden className="text-text-muted">/</span>
                <span>{t("featured")}</span>
              </>
            )}
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight mb-6">{title}</h1>
          <p className="text-text-secondary flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{pub.authors.join(", ")}</span>
            <span aria-hidden className="text-text-muted">·</span>
            <span className="font-mono text-sm tabular-nums">{pub.year}</span>
            {accessLevel === "GATED" && (
              <>
                <span aria-hidden className="text-text-muted">·</span>
                <span className="inline-flex items-center gap-1.5 text-sm text-gold">
                  <Lock aria-hidden className="w-3.5 h-3.5" />
                  {t("members_only")}
                </span>
              </>
            )}
          </p>
        </header>

        {/* Primary actions */}
        {pdfUrl && (
          <div className="flex flex-wrap items-center gap-3 mb-12">
            <SubscriptionGate
              accessLevel={accessLevel as "FREE" | "GATED"}
              requiredAccess="document"
              fallback={
                <ButtonLink href="/subscribe" variant="secondary">
                  <Lock aria-hidden className="w-4 h-4" />
                  {t("download_pdf")}
                </ButtonLink>
              }
            >
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackDownload}
                className={buttonClass("primary", "md")}
              >
                <Download aria-hidden className="w-4 h-4" />
                {t("download_pdf")}
              </a>
            </SubscriptionGate>
          </div>
        )}

        {/* Data & files: the paid part of every publication. The URLs are the
            access-checked route (protectFiles), so the gate here only decides
            what to show; the server decides what to serve. */}
        {(dataUrl || supplementaryUrl) && (
          <section aria-labelledby="pub-data" className="mb-12 card p-6 md:p-7">
            <h2 id="pub-data" className="eyebrow mb-1">
              {t("data_files")}
            </h2>
            <p className="text-sm text-text-secondary mb-5 max-w-xl">{t("data_files_note")}</p>
            <SubscriptionGate
              accessLevel="GATED"
              requiredAccess="data"
              fallback={
                <div className="flex flex-wrap items-center gap-3">
                  {dataUrl && (
                    <ButtonLink href="/subscribe" variant="secondary">
                      <Lock aria-hidden className="w-4 h-4" />
                      {t("download_dataset")}
                    </ButtonLink>
                  )}
                  {supplementaryUrl && (
                    <ButtonLink href="/subscribe" variant="secondary">
                      <Lock aria-hidden className="w-4 h-4" />
                      {t("download_supplementary")}
                    </ButtonLink>
                  )}
                  <span className="text-sm text-text-muted">{t("data_plan_hint")}</span>
                </div>
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                {dataUrl && (
                  <a href={dataUrl} className={buttonClass("primary", "md")} onClick={trackDownload}>
                    <Download aria-hidden className="w-4 h-4" />
                    {t("download_dataset")}
                  </a>
                )}
                {supplementaryUrl && (
                  <a href={supplementaryUrl} className={buttonClass("secondary", "md")} onClick={trackDownload}>
                    <Download aria-hidden className="w-4 h-4" />
                    {t("download_supplementary")}
                  </a>
                )}
              </div>
            </SubscriptionGate>
          </section>
        )}

        {/* Abstract */}
        <section aria-labelledby="pub-abstract" className="mb-12">
          <h2 id="pub-abstract" className="eyebrow mb-4">
            {t("abstract")}
          </h2>
          <p className="font-display text-xl md:text-[1.375rem] leading-[1.6] text-text-primary">{abstract}</p>
        </section>

        {/* Details */}
        <dl className="grid grid-cols-[7rem_1fr] sm:grid-cols-[9rem_1fr] gap-x-6 border-t border-glass-border mb-12">
          {details.map((d) => (
            <div key={d.label} className="contents">
              <dt className="eyebrow text-text-muted py-3.5 border-b border-glass-border">{d.label}</dt>
              <dd className="py-3 border-b border-glass-border text-text-primary min-w-0">{d.value}</dd>
            </div>
          ))}
          {(views !== undefined || downloads > 0 || (citationCount ?? 0) > 0) && (
            <div className="contents">
              <dt className="eyebrow text-text-muted py-3.5 border-b border-glass-border">{t("views")}</dt>
              <dd className="py-3 border-b border-glass-border text-text-secondary font-mono text-sm tabular-nums flex flex-wrap gap-x-5">
                {views !== undefined && (
                  <span>
                    {views} {t("views")}
                  </span>
                )}
                {downloads > 0 && (
                  <span>
                    {downloads} {t("downloads")}
                  </span>
                )}
                {(citationCount ?? 0) > 0 && <span>{citationCount} citations</span>}
              </dd>
            </div>
          )}
        </dl>

        {/* PDF preview */}
        {pdfUrl && (
          <SubscriptionGate
            accessLevel={accessLevel as "FREE" | "GATED"}
            requiredAccess="document"
          >
            <div className="mb-12">
              <Button
                variant="secondary"
                onClick={() => setShowPdf(!showPdf)}
                aria-expanded={showPdf}
                className="mb-4"
              >
                <FileText aria-hidden className="w-4 h-4" />
                {showPdf
                  ? locale === "fr" ? "Masquer le PDF" : "Hide PDF"
                  : locale === "fr" ? "Lire le PDF ici" : "Read the PDF here"}
              </Button>
              {showPdf && <PdfViewer url={pdfUrl} title={title} />}
            </div>
          </SubscriptionGate>
        )}

        {/* Share & cite */}
        <div className="space-y-4 mb-12">
          <ShareButtons title={pub.title} url={`/publications/${pub.slug}`} doi={doi} />
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

        {/* Tags */}
        {pub.tags.length > 0 && (
          <section aria-labelledby="pub-tags" className="mb-12">
            <h2 id="pub-tags" className="eyebrow text-text-muted mb-3">
              {t("tags")}
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-sm text-text-secondary">
              {pub.tags.map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Go deeper: bookstore titles related to this report */}
        {promoBooks.length > 0 && (
          <PromoStrip
            items={promoBooks}
            placement="publication-books"
            title={tPromo("go_deeper")}
            intro={tPromo("go_deeper_intro")}
            className="mb-12"
          />
        )}

        {/* CTA: the session first, then the brief */}
        {accessLevel === "GATED" && <CTABanner variant="premium" />}
        <CTABanner variant="consulting" />
        <NewsletterSignup variant="inline" />

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="pub-related" className="hairline pt-10 mt-4 mb-12">
            <h2 id="pub-related" className="font-display text-2xl mb-4">
              {t("related")}
            </h2>
            <ul className="border-t border-glass-border">
              {related.map((rp) => (
                <li key={rp.slug} className="border-b border-glass-border">
                  <Link
                    href={`/publications/${rp.slug}`}
                    className="group grid grid-cols-[3.5rem_1fr] gap-4 py-4 px-2 -mx-2 rounded-[var(--radius-sm)] hover:bg-[var(--hover-wash)] transition-colors"
                  >
                    <span className="font-mono text-sm tabular-nums text-text-muted pt-0.5">{rp.year}</span>
                    <span className="font-display text-lg leading-snug group-hover:text-gold transition-colors">
                      {locale === "fr" && rp.titleFr ? rp.titleFr : rp.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Comments */}
        <section aria-labelledby="pub-comments" className="hairline pt-10">
          <h2 id="pub-comments" className="font-display text-2xl mb-6">
            {t("comments")} <span className="font-mono text-base text-text-muted tabular-nums">({comments.length})</span>
          </h2>

          {comments.length > 0 && (
            <ul className="mb-8 border-t border-glass-border">
              {comments.map((c) => (
                <li key={c.id} className="py-4 border-b border-glass-border">
                  <p className="text-sm mb-1.5">
                    <span className="font-medium text-text-primary">{c.author.name}</span>
                    <span className="font-mono text-xs text-text-muted ml-3">
                      {new Date(c.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}
                    </span>
                  </p>
                  <p className="text-text-secondary">{c.content}</p>
                </li>
              ))}
            </ul>
          )}

          {session ? (
            <form onSubmit={handleComment}>
              <label htmlFor="pub-comment" className="block text-sm text-text-secondary mb-2">
                {t("leave_comment")}
              </label>
              <textarea
                id="pub-comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="w-full min-h-11 px-4 py-3 bg-navy border border-glass-border rounded-[var(--radius-md)] text-text-primary focus:border-gold focus:outline-none transition-colors resize-y mb-3"
              />
              <Button type="submit" loading={submitting} disabled={!commentText.trim()}>
                {t("post_comment")}
              </Button>
            </form>
          ) : (
            <p className="text-text-secondary">
              <Link href="/auth/login" className="text-gold hover:text-gold-light underline underline-offset-4">
                {t("login_to_comment")}
              </Link>
            </p>
          )}
        </section>
      </Container>
    </article>
  );
}

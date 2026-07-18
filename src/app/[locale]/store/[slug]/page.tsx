import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import AddToCartButton from "@/components/store/AddToCartButton";
import BookViewBeacon from "@/components/store/BookViewBeacon";
import { BookOpen, Check, ChevronLeft, Calendar, Globe, Hash } from "lucide-react";

export const revalidate = 60;

async function getBook(slug: string) {
  return prisma.book.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = normalizeLocale(locale);
  const book = await getBook(slug);
  if (!book) return {};
  const title = l === "fr" && book.titleFr ? book.titleFr : book.title;
  const description =
    (l === "fr" && book.descriptionFr ? book.descriptionFr : book.description).slice(0, 200);
  return buildPageMetadata({
    locale: l,
    path: `/store/${slug}`,
    title,
    description,
    ogTitle: title,
    ogSubtitle: `${book.author} · ${book.publicationYear}`,
    ogType: "book",
  });
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l = normalizeLocale(locale);
  const book = await getBook(slug);
  if (!book) notFound();

  const title = l === "fr" && book.titleFr ? book.titleFr : book.title;
  const subtitle = l === "fr" && book.subtitleFr ? book.subtitleFr : book.subtitle;
  const description = l === "fr" && book.descriptionFr ? book.descriptionFr : book.description;
  const insights =
    (l === "fr" && book.keyInsightsFr.length ? book.keyInsightsFr : book.keyInsights) || [];
  const coverUrl = book.coverImageId ? `/api/uploads/${book.coverImageId}` : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BookViewBeacon slug={book.slug} />
      <Link
        href="/store"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-gold transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {l === "fr" ? "Retour à la librairie" : "Back to bookstore"}
      </Link>

      <div className="grid md:grid-cols-[320px_1fr] gap-8 lg:gap-12">
        {/* Cover + purchase */}
        <div>
          <div className="relative glass rounded-xl overflow-hidden aspect-[3/4] bg-navy/50">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={l === "fr" ? `Couverture de ${title}` : `Cover of ${title}`}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gold/30">
                <BookOpen className="w-20 h-20" />
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-5 mt-4">
            <div className="text-2xl font-bold text-gold mb-4">
              {formatPrice(book.priceCents, book.currency)}
            </div>
            <AddToCartButton
              book={{
                bookId: book.id,
                slug: book.slug,
                title,
                priceCents: book.priceCents,
                coverUrl,
              }}
              withQuantity
              buyNow
            />
            <ul className="text-xs text-text-secondary mt-4 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                {l === "fr"
                  ? "Téléchargement immédiat et sécurisé après paiement PayPal"
                  : "Instant, secure download after PayPal payment"}
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                {l === "fr"
                  ? "Liens valables 7 jours, jusqu'à 5 téléchargements"
                  : "Links valid for 7 days, up to 5 downloads"}
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                {l === "fr"
                  ? "Reçu envoyé par e-mail. Ventes définitives (produit numérique)."
                  : "Receipt emailed to you. All sales final (digital product)."}
              </li>
            </ul>
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">{title}</h1>
          {subtitle && <p className="text-lg text-text-secondary mt-2">{subtitle}</p>}

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary mt-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gold/60" />
              {book.publicationYear}
            </span>
            {book.language && (
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-gold/60" />
                {book.language}
              </span>
            )}
            {book.pageCount ? (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-gold/60" />
                {book.pageCount} {l === "fr" ? "pages" : "pages"}
              </span>
            ) : null}
            {book.isbn && (
              <span className="flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-gold/60" />
                ISBN {book.isbn}
              </span>
            )}
          </div>

          {insights.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-3">
                {l === "fr" ? "Points clés" : "Key insights"}
              </h2>
              <ul className="space-y-2">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-secondary">
                    <Check className="w-4 h-4 text-gold mt-1 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">
              {l === "fr" ? "À propos de cet ouvrage" : "About this book"}
            </h2>
            <div className="text-text-secondary leading-relaxed whitespace-pre-wrap">
              {description}
            </div>
          </div>

          {book.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs rounded-full bg-gold/10 text-gold border border-gold/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

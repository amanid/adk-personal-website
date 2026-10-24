import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  BASE_URL,
  buildPageMetadata,
  bookOgImageUrl,
  normalizeLocale,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from "@/lib/seo";
import { formatFileSize, fileFormatLabel, safeJsonLd } from "@/lib/utils";
import { isPaypalCurrency } from "@/lib/currency";
import { isPaypalApiConfigured, isPaypalDirectConfigured } from "@/lib/paypal-direct";
import { Link } from "@/i18n/routing";
import ProductPurchase from "@/components/store/ProductPurchase";
import { cardPrice, effectivePrice } from "@/lib/pricing";
import BookViewBeacon from "@/components/store/BookViewBeacon";
import BookCard, { type StoreBook } from "@/components/store/BookCard";
import PromoCard from "@/components/promo/PromoCard";
import { getPromos } from "@/lib/promos";
import { BookOpen, Check, ChevronLeft } from "lucide-react";
import type { Book } from "@prisma/client";

export const revalidate = 60;

async function getBook(slug: string) {
  return prisma.book.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
}

/** Other published books that share this book's category or tags (newest first). */
async function getRelatedBooks(book: Book) {
  const orConds = [
    book.category ? { category: book.category } : null,
    book.tags.length ? { tags: { hasSome: book.tags } } : null,
  ].filter(Boolean) as NonNullable<object>[];

  const order = [{ featured: "desc" as const }, { createdAt: "desc" as const }];

  let related: Book[] = [];
  if (orConds.length) {
    related = await prisma.book.findMany({
      where: { status: "PUBLISHED", id: { not: book.id }, OR: orConds },
      orderBy: order,
      take: 4,
    });
  }
  if (related.length === 0) {
    related = await prisma.book.findMany({
      where: { status: "PUBLISHED", id: { not: book.id } },
      orderBy: order,
      take: 4,
    });
  }
  return related;
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
    // Share the actual cover, composited onto a 1.91:1 branded card, so a link
    // posted to LinkedIn/Facebook shows the book rather than the generic card.
    image: {
      url: bookOgImageUrl(slug, l),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: l === "fr" ? `Couverture de ${title}` : `Cover of ${title}`,
    },
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
  const tStore = await getTranslations({ locale: l, namespace: "store" });
  const tPromo = await getTranslations({ locale: l, namespace: "promo" });
  if (!book) notFound();
  // The price in force now (launch offer applied); checkout re-prices anyway.
  const price = effectivePrice(book);

  const title = l === "fr" && book.titleFr ? book.titleFr : book.title;
  const subtitle = l === "fr" && book.subtitleFr ? book.subtitleFr : book.subtitle;
  const description = l === "fr" && book.descriptionFr ? book.descriptionFr : book.description;
  const insights =
    (l === "fr" && book.keyInsightsFr.length ? book.keyInsightsFr : book.keyInsights) || [];
  const coverUrl = book.coverImageId ? `/api/uploads/${book.coverImageId}` : null;

  // What the buyer receives. The file's size lives on the asset, not the book,
  // and is worth showing: these are multi-hundred-page PDFs and someone on a
  // mobile connection deserves to know before paying.
  const format = fileFormatLabel(book.fileMimeType);
  const asset = book.fileId
    ? await prisma.bookAsset.findUnique({
        where: { id: book.fileId },
        select: { size: true },
      })
    : null;
  const fileSize = asset?.size ? formatFileSize(asset.size) : null;

  // Only promise the payment methods this book's currency can actually use:
  // PayPal cannot settle XOF, so an XOF title is mobile money only.
  const paypalAvailable =
    isPaypalCurrency(book.currency) &&
    (isPaypalApiConfigured() || isPaypalDirectConfigured());
  const paymentNote = paypalAvailable
    ? l === "fr"
      ? "Téléchargement sécurisé après paiement (PayPal ou Mobile Money)"
      : "Secure download after payment (PayPal or Mobile Money)"
    : l === "fr"
      ? "Téléchargement sécurisé après paiement (Mobile Money : Wave, Djamo, Orange Money)"
      : "Secure download after payment (Mobile Money: Wave, Djamo, Orange Money)";

  const related = await getRelatedBooks(book);
  // A free report on the same questions: the invitation to read before buying.
  const reading = (await getPromos({ kind: "store", slug: book.slug, category: book.category, tags: book.tags }, { publications: 1, requireRelevance: true })).publications[0] ?? null;
  const relatedBooks: StoreBook[] = related.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: l === "fr" && b.titleFr ? b.titleFr : b.title,
    subtitle: l === "fr" && b.subtitleFr ? b.subtitleFr : b.subtitle,
    author: b.author,
    publicationYear: b.publicationYear,
    ...cardPrice(b),
    currency: b.currency,
    coverUrl: b.coverImageId ? `/api/uploads/${b.coverImageId}` : null,
    firstInsight:
      (l === "fr" ? b.keyInsightsFr[0] : b.keyInsights[0]) || b.keyInsights[0] || null,
    category: b.category,
    tags: b.tags,
    featured: b.featured,
    pageCount: b.pageCount,
    fileMimeType: b.fileMimeType,
  }));

  // Structured data so a search result can carry the cover, price and
  // availability instead of a bare blue link. Declared as both Book and Product:
  // Book is the accurate type, Product is what search engines read offers from.
  const canonical = `${BASE_URL}/${l}/store/${book.slug}`;
  // The schema.org type follows what is actually sold: books and reports are
  // Book, a dataset is Dataset, anything else is a plain Product.
  const isDocument = book.kind === "BOOK" || book.kind === "REPORT";
  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": isDocument ? ["Book", "Product"] : book.kind === "DATASET" ? ["Dataset", "Product"] : "Product",
    name: title,
    ...(subtitle ? { alternativeHeadline: subtitle } : {}),
    description,
    url: canonical,
    ...(coverUrl ? { image: `${BASE_URL}${coverUrl}` } : {}),
    author: { "@type": "Person", name: book.author },
    datePublished: String(book.publicationYear),
    ...(book.pageCount ? { numberOfPages: book.pageCount } : {}),
    ...(book.language ? { inLanguage: book.language } : {}),
    ...(book.isbn && isDocument ? { isbn: book.isbn } : {}),
    ...(isDocument ? { bookFormat: "https://schema.org/EBook" } : {}),
    ...(format ? { fileFormat: book.fileMimeType } : {}),
    offers: {
      "@type": "Offer",
      price: (price.priceCents / 100).toFixed(2),
      priceCurrency: book.currency,
      availability: "https://schema.org/InStock",
      url: canonical,
      seller: { "@type": "Person", name: book.author },
    },
  };

  // Facts the record holds, in the order a buyer scans them. Nothing here is
  // added for show: each row appears only when the book carries the value.
  const facts: { label: string; value: string }[] = [
    { label: l === "fr" ? "Auteur" : "Author", value: book.author },
    { label: l === "fr" ? "Année" : "Year", value: String(book.publicationYear) },
    ...(book.language ? [{ label: l === "fr" ? "Langue" : "Language", value: book.language }] : []),
    ...(book.pageCount ? [{ label: "Pages", value: book.pageCount.toLocaleString(l) }] : []),
    ...(format ? [{ label: "Format", value: fileSize ? `${format} · ${fileSize}` : format }] : []),
    ...(book.isbn ? [{ label: "ISBN", value: book.isbn }] : []),
  ];

  const check = <Check aria-hidden="true" className="w-4 h-4 text-success mt-0.5 shrink-0" />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(bookJsonLd) }}
      />
      <BookViewBeacon slug={book.slug} />
      <Link
        href="/store"
        className="inline-flex items-center gap-1 min-h-11 text-sm text-text-secondary hover:text-gold transition-colors mb-6"
      >
        <ChevronLeft aria-hidden="true" className="w-4 h-4" />
        {l === "fr" ? "Retour à la librairie" : "Back to bookstore"}
      </Link>

      <div className="grid md:grid-cols-[minmax(0,340px)_1fr] gap-10 lg:gap-14 items-start">
        {/* Cover */}
        <div className="md:sticky md:top-24">
          <div className="relative aspect-[3/4] w-full max-w-[340px] mx-auto overflow-hidden rounded-[var(--radius-sm)] bg-navy border border-glass-border shadow-[var(--elev-lg)]">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={l === "fr" ? `Couverture de ${title}` : `Cover of ${title}`}
                fill
                sizes="(max-width: 768px) 90vw, 340px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <BookOpen aria-hidden="true" className="w-20 h-20" />
              </div>
            )}
          </div>
        </div>

        {/* Title, buy box, description */}
        <div className="min-w-0">
          {book.kind !== "BOOK" && <p className="eyebrow mb-3">{tStore(`kind_${book.kind}`)}</p>}
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">{title}</h1>
          {subtitle && <p className="lede mt-3">{subtitle}</p>}

          <div className="card-feature card p-6 mt-8">
            <ProductPurchase
              item={{ bookId: book.id, slug: book.slug, title, currency: book.currency, coverUrl }}
              priceCents={price.priceCents}
              regularCents={price.regularCents}
              saleEndsAt={price.saleEndsAt ? price.saleEndsAt.toISOString() : null}
              payWhatYouWant={price.payWhatYouWant}
              withQuantity={!price.payWhatYouWant}
            />
            <ul className="text-sm text-text-secondary mt-6 pt-5 border-t border-glass-border space-y-2">
              <li className="flex items-start gap-2">
                {check}
                {paymentNote}
              </li>
              <li className="flex items-start gap-2">
                {check}
                {l === "fr"
                  ? "Lien valable 7 jours, jusqu'à 5 téléchargements"
                  : "Link valid for 7 days, up to 5 downloads"}
              </li>
              <li className="flex items-start gap-2">
                {check}
                {l === "fr"
                  ? "Reçu envoyé par e-mail. Ventes définitives (produit numérique)."
                  : "Receipt sent by email. All sales are final (digital product)."}
              </li>
            </ul>
          </div>

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 text-sm">
            {facts.map((f) => (
              <div key={f.label} className="contents">
                <dt className="eyebrow text-text-muted py-2.5 border-b border-glass-border">{f.label}</dt>
                <dd className="font-mono tabular-nums text-text-primary py-2.5 border-b border-glass-border min-w-0 break-words">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 max-w-prose">
            <h2 className="font-display text-2xl mb-4">
              {isDocument
                ? l === "fr" ? "À propos de cet ouvrage" : "About this book"
                : l === "fr" ? "À propos de ce produit" : "About this product"}
            </h2>
            <div className="text-text-secondary text-[1.0625rem] leading-relaxed whitespace-pre-wrap">
              {description}
            </div>
          </div>

          {insights.length > 0 && (
            <div className="mt-10 max-w-prose">
              <h2 className="font-display text-2xl mb-4">
                {l === "fr" ? "Points clés" : "Key insights"}
              </h2>
              <ul className="space-y-3">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3 text-text-secondary leading-relaxed">
                    <Check aria-hidden="true" className="w-4 h-4 text-gold mt-1 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {book.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2" aria-label={l === "fr" ? "Mots-clés" : "Tags"}>
              {book.tags.map((tag) => (
                <li
                  key={tag}
                  className="px-3 py-1 font-mono text-xs rounded-full border border-glass-border text-text-secondary"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {reading && (
        <div className="mt-16">
          <PromoCard item={reading} placement="store-reading" eyebrow={tPromo("research_behind")} />
        </div>
      )}

      {relatedBooks.length > 0 && (
        <section className="mt-20 pt-14 hairline" aria-labelledby="related-heading">
          <h2 id="related-heading" className="h-section mb-10">
            {l === "fr" ? "À découvrir aussi" : "You might also like"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12 sm:gap-x-8">
            {relatedBooks.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

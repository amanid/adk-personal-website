import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { cardPrice } from "@/lib/pricing";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import { type StoreBook } from "@/components/store/BookCard";
import StoreBrowser from "@/components/store/StoreBrowser";
import BundleCard, { type BundleCardData } from "@/components/store/BundleCard";
import { loadBundles } from "@/lib/bundles";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Section";
import { BookOpen, ArrowRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const title = l === "fr" ? "Librairie" : "Bookstore";
  const description =
    l === "fr"
      ? "Achetez et téléchargez les ouvrages de KONAN Amani Dieudonné en toute sécurité."
      : "Buy and securely download books published by KONAN Amani Dieudonné.";
  return buildPageMetadata({
    locale: l,
    path: "/store",
    title,
    description,
    ogTitle: title,
    ogSubtitle: description,
    ogType: "website",
  });
}

// Catalog is effectively static content; revalidate periodically instead of
// re-querying on every request.
export const revalidate = 60;

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = normalizeLocale(locale);

  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const storeBooks: StoreBook[] = books.map((b) => ({
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
    kind: b.kind,
  }));

  const bundles: BundleCardData[] = (await loadBundles().catch(() => [])).map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    titleFr: b.titleFr,
    priceCents: b.priceCents,
    currency: b.currency,
    savingCents: b.savingCents,
    separateCents: b.separateCents,
    coverUrl: b.coverImageId ? `/api/uploads/${b.coverImageId}` : null,
    bookTitles: b.items.map((i) => (l === "fr" && i.book.titleFr ? i.book.titleFr : i.book.title)),
    covers: b.items.flatMap((i) => (i.book.coverImageId ? [`/api/uploads/${i.book.coverImageId}`] : [])),
  }));

  return (
    <Container size="wide" className="py-14 md:py-20">
      <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">{l === "fr" ? "Boutique" : "Store"}</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight">
            {l === "fr" ? "Librairie" : "Bookstore"}
          </h1>
          <p className="lede mt-5">
            {l === "fr"
              ? "Mes livres et autres publications. Après le paiement, vous les téléchargez depuis un lien privé."
              : "My books and other publications. After payment, you download them from a private link."}
          </p>
        </div>
        <Link
          href="/store/orders"
          className="inline-flex items-center gap-1.5 min-h-11 text-sm text-text-secondary hover:text-gold transition-colors shrink-0"
        >
          {l === "fr" ? "Retrouver mes commandes" : "Find my orders"}
          <ArrowRight aria-hidden="true" className="w-4 h-4" />
        </Link>
      </header>

      {storeBooks.length === 0 ? (
        <div className="card p-12 text-center text-text-secondary">
          <BookOpen aria-hidden="true" className="w-10 h-10 mx-auto mb-4 text-text-muted" />
          <p>{l === "fr" ? "Aucun ouvrage disponible pour le moment." : "No books available yet."}</p>
        </div>
      ) : (
        <StoreBrowser books={storeBooks} />
      )}

      {bundles.length > 0 && (
        <section className="mt-20 pt-14 hairline" aria-labelledby="bundles-heading">
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow mb-3">{l === "fr" ? "Packs" : "Bundles"}</p>
            <h2 id="bundles-heading" className="h-section">
              {l === "fr" ? "Plusieurs titres ensemble" : "Several titles together"}
            </h2>
            <p className="lede mt-3">
              {l === "fr" ? "Achetés en pack, ils coûtent moins cher que séparément." : "Bought as a bundle, they cost less than separately."}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((b) => (
              <BundleCard key={b.id} bundle={b} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

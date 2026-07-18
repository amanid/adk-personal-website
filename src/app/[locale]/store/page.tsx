import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import BookCard, { type StoreBook } from "@/components/store/BookCard";
import { BookOpen } from "lucide-react";

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

export const dynamic = "force-dynamic";

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
    publicationYear: b.publicationYear,
    priceCents: b.priceCents,
    currency: b.currency,
    coverUrl: b.coverImageId ? `/api/uploads/${b.coverImageId}` : null,
    firstInsight:
      (l === "fr" ? b.keyInsightsFr[0] : b.keyInsights[0]) || b.keyInsights[0] || null,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text font-[family-name:var(--font-display)]">
          {l === "fr" ? "Librairie" : "Bookstore"}
        </h1>
        <p className="text-text-secondary mt-3 max-w-2xl mx-auto">
          {l === "fr"
            ? "Parcourez les ouvrages, choisissez vos quantités et téléchargez en toute sécurité après paiement."
            : "Browse the books, choose your quantities, and download securely after payment."}
        </p>
      </header>

      {storeBooks.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-text-secondary">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gold/40" />
          <p>{l === "fr" ? "Aucun ouvrage disponible pour le moment." : "No books available yet. Check back soon."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {storeBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

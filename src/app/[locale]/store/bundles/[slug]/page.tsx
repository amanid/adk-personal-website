import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale, BASE_URL } from "@/lib/seo";
import { loadBundles } from "@/lib/bundles";
import { effectivePrice, bundleCartId } from "@/lib/pricing";
import { formatPrice, safeJsonLd } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import AddToCartButton from "@/components/store/AddToCartButton";
import { ChevronLeft, Check } from "lucide-react";

export const revalidate = 60;

async function getBundle(slug: string) {
  return (await loadBundles({ slug }).catch(() => []))[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = normalizeLocale(locale);
  const b = await getBundle(slug);
  if (!b) return { title: "Bundle" };
  const title = l === "fr" && b.titleFr ? b.titleFr : b.title;
  const description = (l === "fr" && b.descriptionFr ? b.descriptionFr : b.description).slice(0, 160);
  return buildPageMetadata({ locale: l, path: `/store/bundles/${b.slug}`, title, description, ogTitle: title, ogSubtitle: "Bundle" });
}

export default async function BundlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const l = normalizeLocale(locale);
  const b = await getBundle(slug);
  if (!b) notFound();
  const t = await getTranslations({ locale: l, namespace: "store" });

  const title = l === "fr" && b.titleFr ? b.titleFr : b.title;
  const description = l === "fr" && b.descriptionFr ? b.descriptionFr : b.description;
  const cover =
    (b.coverImageId && `/api/uploads/${b.coverImageId}`) ||
    (b.items[0]?.book.coverImageId ? `/api/uploads/${b.items[0].book.coverImageId}` : null);

  const canonical = `${BASE_URL}/${l}/store/bundles/${b.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description,
    url: canonical,
    ...(cover ? { image: `${BASE_URL}${cover}` } : {}),
    isRelatedTo: b.items.map(({ book }) => ({ "@type": "Product", name: book.title, url: `${BASE_URL}/${l}/store/${book.slug}` })),
    offers: {
      "@type": "Offer",
      price: (b.priceCents / 100).toFixed(2),
      priceCurrency: b.currency,
      availability: "https://schema.org/InStock",
      url: canonical,
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Link href="/store" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-gold mb-6">
        <ChevronLeft className="w-4 h-4" /> {l === "fr" ? "Retour à la boutique" : "Back to the store"}
      </Link>
      <p className="eyebrow mb-2">{t("bundles_title")}</p>
      <h1 className="text-3xl md:text-4xl font-semibold mb-4">{title}</h1>
      <p className="text-text-secondary leading-relaxed max-w-3xl whitespace-pre-line mb-8">{description}</p>

      <div className="grid md:grid-cols-[1fr_20rem] gap-8 items-start">
        <section>
          <h2 className="text-lg font-semibold mb-4">{t("bundle_includes")}</h2>
          <ul className="space-y-3">
            {b.items.map(({ book }) => (
              <li key={book.id} className="glass p-3 flex items-center gap-4">
                <div className="relative w-12 h-16 shrink-0 rounded-sm overflow-hidden bg-navy">
                  {book.coverImageId && (
                    <Image src={`/api/uploads/${book.coverImageId}`} alt="" fill className="object-cover" sizes="48px" unoptimized />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/store/${book.slug}`} className="font-medium hover:text-gold line-clamp-1">
                    {l === "fr" && book.titleFr ? book.titleFr : book.title}
                  </Link>
                  {book.kind !== "BOOK" && <p className="text-xs text-text-muted">{t(`kind_${book.kind}`)}</p>}
                </div>
                <span className="figure text-sm text-text-secondary">
                  {formatPrice(effectivePrice(book).priceCents, book.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="glass p-5 md:sticky md:top-24">
          {cover && (
            <div className="relative aspect-[3/4] mb-4 rounded-md overflow-hidden bg-navy">
              <Image src={cover} alt="" fill className="object-cover" sizes="320px" unoptimized />
            </div>
          )}
          <p className="text-2xl font-bold text-gold">{formatPrice(b.priceCents, b.currency)}</p>
          {b.savingCents > 0 && (
            <p className="text-sm text-text-secondary mt-1">
              {t("bundle_value", { amount: formatPrice(b.separateCents, b.currency) })} ·{" "}
              <span className="text-gold font-medium">{t("bundle_save", { amount: formatPrice(b.savingCents, b.currency) })}</span>
            </p>
          )}
          <div className="mt-4">
            <AddToCartButton
              book={{
                bookId: bundleCartId(b.id),
                slug: `bundles/${b.slug}`,
                title,
                priceCents: b.priceCents,
                currency: b.currency,
                coverUrl: cover,
              }}
              buyNow
            />
          </div>
          <p className="text-xs text-text-secondary mt-4 flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
            {l === "fr"
              ? "Un lien de téléchargement sécurisé par titre, envoyé après paiement."
              : "One secure download link per title, sent after payment."}
          </p>
        </aside>
      </div>
    </div>
  );
}

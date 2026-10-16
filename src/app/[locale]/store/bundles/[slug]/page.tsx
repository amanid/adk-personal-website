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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Link
        href="/store"
        className="inline-flex items-center gap-1 min-h-11 text-sm text-text-secondary hover:text-gold transition-colors mb-6"
      >
        <ChevronLeft aria-hidden="true" className="w-4 h-4" /> {l === "fr" ? "Retour à la librairie" : "Back to bookstore"}
      </Link>
      <header className="max-w-3xl mb-10">
        <p className="eyebrow mb-3">{t("bundles_title")}</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">{title}</h1>
        {description && <p className="lede mt-5 whitespace-pre-line">{description}</p>}
      </header>

      <div className="grid md:grid-cols-[1fr_20rem] gap-10 items-start">
        <section aria-labelledby="bundle-items">
          <h2 id="bundle-items" className="eyebrow text-text-muted mb-2">{t("bundle_includes")}</h2>
          <ul>
            {b.items.map(({ book }) => (
              <li key={book.id} className="py-4 border-b border-glass-border flex items-center gap-4">
                <div className="relative w-12 h-16 shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-navy border border-glass-border">
                  {book.coverImageId && (
                    <Image src={`/api/uploads/${book.coverImageId}`} alt="" fill className="object-cover" sizes="48px" unoptimized />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/store/${book.slug}`} className="font-display text-lg leading-snug hover:text-gold transition-colors line-clamp-2">
                    {l === "fr" && book.titleFr ? book.titleFr : book.title}
                  </Link>
                  {book.kind !== "BOOK" && <p className="text-xs text-text-muted mt-0.5">{t(`kind_${book.kind}`)}</p>}
                </div>
                <span className="font-mono tabular-nums text-sm text-text-secondary shrink-0">
                  {formatPrice(effectivePrice(book).priceCents, book.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="card-feature card p-6 md:sticky md:top-24">
          {cover && (
            <div className="relative aspect-[3/4] mb-5 rounded-[var(--radius-sm)] overflow-hidden bg-navy border border-glass-border">
              <Image src={cover} alt="" fill className="object-cover" sizes="320px" unoptimized />
            </div>
          )}
          <p className="font-mono tabular-nums text-3xl font-medium">{formatPrice(b.priceCents, b.currency)}</p>
          {b.savingCents > 0 && (
            <p className="text-sm text-text-secondary mt-2 flex flex-wrap items-center gap-2">
              <span>{t("bundle_value", { amount: formatPrice(b.separateCents, b.currency) })}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/15 text-success">
                {t("bundle_save", { amount: formatPrice(b.savingCents, b.currency) })}
              </span>
            </p>
          )}
          <div className="mt-5">
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
          <p className="text-sm text-text-secondary mt-5 pt-4 border-t border-glass-border flex items-start gap-2">
            <Check aria-hidden="true" className="w-4 h-4 text-success mt-0.5 shrink-0" />
            {l === "fr"
              ? "Un lien de téléchargement sécurisé par titre, envoyé après paiement."
              : "One secure download link per title, sent after payment."}
          </p>
        </aside>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { buildPageMetadata, normalizeLocale, BASE_URL } from "@/lib/seo";
import { safeJsonLd } from "@/lib/utils";
import { getTopics } from "@/lib/topics";
import { Container } from "@/components/ui/Section";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "topics" });
  return buildPageMetadata({ locale: l, path: "/topics", title: t("meta_title"), description: t("meta_description"), ogTitle: t("title"), ogSubtitle: t("eyebrow") });
}

export default async function TopicsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "topics" });
  const topics = await getTopics().catch(() => []);
  const max = Math.max(1, ...topics.map((x) => x.count));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    url: `${BASE_URL}/${l}/topics`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: topics.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, url: `${BASE_URL}/${l}/topics/${x.slug}` })),
    },
  };

  return (
    <Container className="pt-16 md:pt-24 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <header className="max-w-3xl mb-12">
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
        <p className="lede">{t("subtitle")}</p>
      </header>
      <ul className="grid sm:grid-cols-2 gap-x-12 border-t border-glass-border sm:border-t-0">
        {topics.map((x) => (
          <li key={x.slug} className="sm:border-t border-b sm:border-b-0 border-glass-border">
            <Link
              href={`/topics/${x.slug}`}
              className="group block py-5 px-2 -mx-2 rounded-[var(--radius-sm)] hover:bg-[var(--hover-wash)] transition-colors"
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="font-display text-2xl leading-snug group-hover:text-gold transition-colors">{x.name}</span>
                <span className="font-mono text-sm tabular-nums text-text-muted shrink-0">
                  {x.firstYear === x.lastYear ? x.lastYear : `${x.firstYear}–${x.lastYear}`}
                </span>
              </span>
              <span className="block text-sm text-text-secondary mt-1">{t("n_publications", { n: x.count })}</span>
              {/* Share of the largest topic, so the list reads as a quick size comparison. */}
              <span className="block mt-3 h-px bg-glass-border" aria-hidden="true">
                <span className="block h-px bg-gold" style={{ width: `${(x.count / max) * 100}%` }} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { buildPageMetadata, normalizeLocale, BASE_URL } from "@/lib/seo";
import { safeJsonLd } from "@/lib/utils";
import { getTopics } from "@/lib/topics";

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
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <p className="eyebrow mb-3">{t("eyebrow")}</p>
      <h1 className="text-3xl md:text-5xl font-semibold mb-4">{t("title")}</h1>
      <p className="text-text-secondary text-lg max-w-2xl mb-10">{t("subtitle")}</p>
      <ul className="grid sm:grid-cols-2 gap-4">
        {topics.map((x) => (
          <li key={x.slug}>
            <Link href={`/topics/${x.slug}`} className="glass block p-5 hover:border-gold/40 transition-colors h-full">
              <p className="font-semibold text-lg">{x.name}</p>
              <p className="text-sm text-text-secondary mt-1">
                {t("n_publications", { n: x.count })} · <span className="figure">{x.firstYear === x.lastYear ? x.lastYear : `${x.firstYear}–${x.lastYear}`}</span>
              </p>
              {/* Share of the largest topic, so the list reads as a quick size comparison. */}
              <div className="mt-3 h-1 rounded-full bg-glass-border/60" aria-hidden="true">
                <div className="h-1 rounded-full bg-gold" style={{ width: `${(x.count / max) * 100}%` }} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

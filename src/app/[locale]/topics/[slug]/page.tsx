import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { buildPageMetadata, normalizeLocale, BASE_URL } from "@/lib/seo";
import { safeJsonLd } from "@/lib/utils";
import { getTopic } from "@/lib/topics";

export const revalidate = 3600;

type Params = { params: Promise<{ locale: string; slug: string }> };

const span = (a: number, b: number) => (a === b ? String(b) : `${a}–${b}`);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "topics" });
  const data = await getTopic(slug).catch(() => null);
  if (!data) return { title: t("meta_title"), robots: { index: false } };
  const { topic } = data;
  return buildPageMetadata({
    locale: l,
    path: `/topics/${topic.slug}`,
    title: t("topic_title", { topic: topic.name }),
    description: t("topic_meta_description", { n: topic.count, topic: topic.name, years: span(topic.firstYear, topic.lastYear) }),
    ogTitle: topic.name,
    ogSubtitle: t("n_publications", { n: topic.count }),
  });
}

export default async function TopicPage({ params }: Params) {
  const { locale, slug } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "topics" });
  const data = await getTopic(slug).catch(() => null);
  if (!data) notFound();
  const { topic, publications, products, posts } = data;
  const fr = l === "fr";
  const url = `${BASE_URL}/${l}/topics/${topic.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("topic_title", { topic: topic.name }),
    url,
    about: { "@type": "Thing", name: topic.name },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: publications.length,
      itemListElement: publications.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: (fr && p.titleFr) || p.title, url: `${BASE_URL}/${l}/publications/${p.slug}` })),
    },
  };

  const stats = [
    [t("stat_publications"), String(topic.count)],
    [t("stat_years"), span(topic.firstYear, topic.lastYear)],
    [t("stat_free"), String(topic.free)],
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <p className="eyebrow mb-3">
        <Link href="/topics" className="hover:text-gold">{t("all_topics")}</Link>
      </p>
      <h1 className="text-3xl md:text-5xl font-semibold mb-8">{t("topic_title", { topic: topic.name })}</h1>

      <dl className="grid grid-cols-3 gap-3 mb-12 max-w-xl">
        {stats.map(([label, value]) => (
          <div key={label} className="glass p-4 flex flex-col-reverse">
            <dt className="text-xs text-text-muted mt-1">{label}</dt>
            <dd className="figure text-2xl md:text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t("publications")}</h2>
        <ul className="space-y-3">
          {publications.map((p) => {
            const abstract = (fr && p.abstractFr) || p.abstract;
            return (
              <li key={p.slug} className="glass p-4">
                <Link href={`/publications/${p.slug}`} className="font-medium hover:text-gold">{(fr && p.titleFr) || p.title}</Link>
                <p className="text-xs text-text-muted mt-1">
                  <span className="figure">{p.year}</span> · {p.access === "free" ? t("free") : t("subscription")}
                </p>
                <p className="text-sm text-text-secondary mt-2 line-clamp-2">{abstract}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {products.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">{t("products")}</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {products.map((b) => (
              <li key={b.slug}>
                <Link href={`/store/${b.slug}`} className="glass block p-4 hover:border-gold/40 h-full">
                  <span className="font-medium">{(fr && b.titleFr) || b.title}</span>
                  <span className="block text-xs text-text-muted mt-1">
                    {b.kind.toLowerCase()} · <span className="figure">{b.publicationYear}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">{t("posts")}</h2>
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="hover:text-gold">{(fr && p.titleFr) || p.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass-strong p-6">
        <h2 className="text-xl font-semibold mb-2">{t("cta_title", { topic: topic.name })}</h2>
        <p className="text-sm text-text-secondary mb-4">{t("cta_body")}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/book" className="px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">{t("cta_book")}</Link>
          <Link href="/services" className="px-4 py-2 rounded-md border border-glass-border text-sm">{t("cta_quote")}</Link>
        </div>
      </section>
    </div>
  );
}

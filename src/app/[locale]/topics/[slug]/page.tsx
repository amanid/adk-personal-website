import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { buildPageMetadata, normalizeLocale, BASE_URL } from "@/lib/seo";
import { safeJsonLd } from "@/lib/utils";
import { getTopic } from "@/lib/topics";
import { Container } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";

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
    <Container className="pt-16 md:pt-24 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <header className="max-w-3xl mb-10">
        <p className="eyebrow mb-4">
          <Link href="/topics" className="inline-flex items-center min-h-11 hover:text-gold-light">
            ← {t("all_topics")}
          </Link>
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight">{t("topic_title", { topic: topic.name })}</h1>
      </header>

      <dl className="flex flex-wrap gap-x-10 gap-y-4 py-5 mb-14 border-y border-glass-border">
        {stats.map(([label, value]) => (
          <div key={label} className="flex flex-row-reverse justify-end items-baseline gap-3">
            <dt className="eyebrow text-text-muted">{label}</dt>
            <dd className="font-mono text-2xl tabular-nums text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="topic-pubs" className="mb-16">
        <h2 id="topic-pubs" className="h-section mb-6">{t("publications")}</h2>
        <ol className="border-t border-glass-border">
          {publications.map((p) => {
            const abstract = (fr && p.abstractFr) || p.abstract;
            return (
              <li key={p.slug} className="border-b border-glass-border">
                <Link
                  href={`/publications/${p.slug}`}
                  className="group grid grid-cols-[3.5rem_1fr] md:grid-cols-[5rem_1fr] gap-x-4 md:gap-x-8 py-6 px-2 -mx-2 rounded-[var(--radius-sm)] hover:bg-[var(--hover-wash)] transition-colors"
                >
                  <span className="font-mono text-sm tabular-nums text-text-muted pt-1">{p.year}</span>
                  <span className="min-w-0">
                    <span className="block font-display text-xl md:text-2xl leading-snug group-hover:text-gold transition-colors">
                      {(fr && p.titleFr) || p.title}
                    </span>
                    <span className={`block mt-1.5 text-sm ${p.access === "free" ? "text-text-muted" : "text-gold"}`}>
                      {p.access === "free" ? t("free") : t("subscription")}
                    </span>
                    <span className="block mt-2 text-text-secondary leading-relaxed line-clamp-2 max-w-3xl">{abstract}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {products.length > 0 && (
        <section aria-labelledby="topic-products" className="mb-16">
          <h2 id="topic-products" className="h-section mb-6">{t("products")}</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {products.map((b) => (
              <li key={b.slug}>
                <Link href={`/store/${b.slug}`} className="card card-interactive block p-5 h-full">
                  <span className="font-display text-lg leading-snug">{(fr && b.titleFr) || b.title}</span>
                  <span className="block text-sm text-text-muted mt-1.5">
                    {b.kind.toLowerCase()} · <span className="font-mono tabular-nums">{b.publicationYear}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section aria-labelledby="topic-posts" className="mb-16">
          <h2 id="topic-posts" className="h-section mb-6">{t("posts")}</h2>
          <ul className="border-t border-glass-border">
            {posts.map((p) => (
              <li key={p.slug} className="border-b border-glass-border">
                <Link href={`/blog/${p.slug}`} className="flex items-center min-h-11 py-3 font-display text-lg hover:text-gold transition-colors">
                  {(fr && p.titleFr) || p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card card-feature p-6 md:p-8">
        <h2 className="font-display text-2xl mb-2">{t("cta_title", { topic: topic.name })}</h2>
        <p className="text-text-secondary mb-5">{t("cta_body")}</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/book">{t("cta_book")}</ButtonLink>
          <ButtonLink href="/services" variant="secondary">{t("cta_quote")}</ButtonLink>
        </div>
      </section>
    </Container>
  );
}

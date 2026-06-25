import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const BASE_URL = "https://www.konanamanidieudonne.org";

export type AppLocale = "en" | "fr";

/** Normalize an incoming locale string to a supported AppLocale. */
export function normalizeLocale(locale: string): AppLocale {
  return locale === "fr" ? "fr" : "en";
}

/**
 * Per-route canonical + hreflang alternates. Every page should set these so
 * search engines stop inheriting the homepage canonical from the root layout.
 */
export function pageAlternates(locale: AppLocale, path: string): Metadata["alternates"] {
  return {
    canonical: `${BASE_URL}/${locale}${path}`,
    languages: {
      en: `${BASE_URL}/en${path}`,
      fr: `${BASE_URL}/fr${path}`,
      "x-default": `${BASE_URL}/en${path}`,
    },
  };
}

/** Build a URL for the dynamic OG image route (src/app/api/og). */
export function ogImageUrl(title: string, subtitle: string, type = "page"): string {
  return `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(
    subtitle
  )}&type=${type}`;
}

/**
 * Assemble a complete, SEO-correct Metadata object for a page: per-route
 * canonical/hreflang, OpenGraph (article) and a large Twitter card.
 */
export function buildPageMetadata(opts: {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogSubtitle: string;
  ogType?: string;
}): Metadata {
  const { locale, path, title, description, ogTitle, ogSubtitle, ogType } = opts;
  const url = `${BASE_URL}/${locale}${path}`;
  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [ogImageUrl(ogTitle, ogSubtitle, ogType)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Factory for a static page's `generateMetadata`, reusing the page's existing
 * next-intl `title`/`subtitle` translations so copy stays in one place.
 */
export function staticPageMetadata(opts: {
  namespace: string;
  path: string;
  ogType?: string;
}) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const l = normalizeLocale(locale);
    const t = await getTranslations({ locale: l, namespace: opts.namespace });
    const title = t("title");
    const description = t("subtitle");
    return buildPageMetadata({
      locale: l,
      path: opts.path,
      title,
      description,
      ogTitle: title,
      ogSubtitle: description,
      ogType: opts.ogType,
    });
  };
}

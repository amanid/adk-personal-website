import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const BASE_URL = "https://www.konanamanidieudonne.org";

export type AppLocale = "en" | "fr";

/** Normalize an incoming locale string to a supported AppLocale. */
export function normalizeLocale(locale: string): AppLocale {
  return locale === "fr" ? "fr" : "en";
}

/** The 1.91:1 card size Facebook, LinkedIn and X all expect. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
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

/**
 * Build a URL for the dynamic OG image route (src/app/api/og).
 *
 * Absolute rather than relative: LinkedIn in particular refuses to resolve a
 * relative og:image, so we never rely on metadataBase for share cards.
 */
export function ogImageUrl(title: string, subtitle: string, type = "page"): string {
  return `${BASE_URL}/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(
    subtitle
  )}&type=${type}`;
}

/**
 * Share card for a bookstore title: the real cover composited onto a branded
 * 1200x630 canvas (see src/app/api/og/book/[slug]).
 */
export function bookOgImageUrl(slug: string, locale: AppLocale): string {
  return `${BASE_URL}/api/og/book/${encodeURIComponent(slug)}?locale=${locale}`;
}

/**
 * Assemble a complete, SEO-correct Metadata object for a page: per-route
 * canonical/hreflang, OpenGraph (article) and a large Twitter card.
 *
 * Pass `image` to override the generated card — e.g. a book's cover card. The
 * image is declared on both OpenGraph and Twitter with explicit dimensions,
 * which is what stops crawlers falling back to the site-wide default.
 */
export function buildPageMetadata(opts: {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogSubtitle: string;
  ogType?: string;
  image?: OgImage;
}): Metadata {
  const { locale, path, title, description, ogTitle, ogSubtitle, ogType, image } = opts;
  const url = `${BASE_URL}/${locale}${path}`;
  const card: OgImage = image ?? {
    url: ogImageUrl(ogTitle, ogSubtitle, ogType),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: ogTitle,
  };

  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    openGraph: {
      type: "article",
      url,
      siteName: "KONAN Amani Dieudonné",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      title,
      description,
      images: [card],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [card.url],
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

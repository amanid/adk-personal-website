import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, type AppLocale } from "@/lib/seo";
import { publications } from "@/data/publications";
import { prisma } from "@/lib/prisma";
import PublicationDetailClient from "./PublicationDetailClient";

function clip(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

async function resolvePublication(slug: string, locale: AppLocale) {
  const fr = locale === "fr";

  // Static publications first (no DB dependency).
  const stat = publications.find((p) => p.slug === slug);
  if (stat) {
    return {
      title: (fr && stat.titleFr) || stat.title,
      abstract: (fr && stat.abstractFr) || stat.abstract,
    };
  }

  // Fall back to database-backed publications.
  try {
    const db = await prisma.publication.findUnique({
      where: { slug },
      select: { title: true, titleFr: true, abstract: true, abstractFr: true },
    });
    if (db) {
      return {
        title: (fr && db.titleFr) || db.title,
        abstract: (fr && db.abstractFr) || db.abstract,
      };
    }
  } catch {
    // DB unavailable — fall through to generic metadata.
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = normalizeLocale(locale);
  const pub = await resolvePublication(slug, l);

  if (!pub) {
    return {
      title: l === "fr" ? "Publication" : "Publication",
      description:
        l === "fr"
          ? "Publications et travaux de recherche de KONAN Amani Dieudonné."
          : "Publications and research output by KONAN Amani Dieudonné.",
      alternates: { canonical: undefined },
      robots: { index: false },
    };
  }

  const description = clip(pub.abstract);
  return buildPageMetadata({
    locale: l,
    path: `/publications/${slug}`,
    title: pub.title,
    description,
    ogTitle: clip(pub.title, 90),
    ogSubtitle: l === "fr" ? "Publication" : "Publication",
    ogType: "publication",
  });
}

export default function PublicationDetailPage() {
  return <PublicationDetailClient />;
}

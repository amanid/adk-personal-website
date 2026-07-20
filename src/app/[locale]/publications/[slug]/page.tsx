import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, type AppLocale } from "@/lib/seo";
import { publications } from "@/data/publications";
import { prisma } from "@/lib/prisma";
import PublicationDetailClient, { type RelatedPub } from "./PublicationDetailClient";

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

export const revalidate = 300;

export default async function PublicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  // Compute "related" on the server (was a whole-corpus fetch on the client).
  let initialRelated: RelatedPub[] = [];
  try {
    const staticPub = publications.find((p) => p.slug === slug);
    let category: string | null = staticPub?.category ?? null;
    let tags: string[] = staticPub?.tags ?? [];
    if (!staticPub) {
      const cur = await prisma.publication.findUnique({
        where: { slug },
        select: { category: true, tags: true },
      });
      category = cur?.category ?? null;
      tags = cur?.tags ?? [];
    }
    const tagSet = new Set(tags);

    const candidates = await prisma.publication.findMany({
      where: { slug: { not: slug } },
      select: {
        slug: true,
        title: true,
        titleFr: true,
        year: true,
        publicationType: true,
        authors: true,
        category: true,
        tags: true,
      },
    });

    const scored = candidates.map((p) => ({
      pub: {
        slug: p.slug,
        title: p.title,
        titleFr: p.titleFr ?? undefined,
        year: p.year,
        publicationType: p.publicationType,
        authors: p.authors,
        category: p.category ?? undefined,
        tags: p.tags,
      },
      score: (p.category === category ? 3 : 0) + p.tags.filter((tg) => tagSet.has(tg)).length,
    }));
    scored.sort((a, b) => b.score - a.score);
    initialRelated = scored.slice(0, 4).map((s) => s.pub);
  } catch {
    // DB unavailable — related simply stays empty.
  }

  return <PublicationDetailClient initialRelated={initialRelated} />;
}

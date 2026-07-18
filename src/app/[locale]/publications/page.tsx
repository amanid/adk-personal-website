import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import PublicationsClient, { type DbPublicationRow } from "./PublicationsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "publications" });
  const title = t("title");
  const description = t("subtitle");
  return buildPageMetadata({
    locale: l,
    path: "/publications",
    title,
    description,
    ogTitle: title,
    ogSubtitle: description,
    ogType: "publication",
  });
}

export const revalidate = 300;

export default async function PublicationsPage() {
  let dbPublications: DbPublicationRow[] = [];
  try {
    dbPublications = await prisma.publication.findMany({
      orderBy: { year: "desc" },
      select: {
        id: true,
        title: true,
        titleFr: true,
        slug: true,
        abstract: true,
        abstractFr: true,
        authors: true,
        journal: true,
        year: true,
        category: true,
        pdfUrl: true,
        tags: true,
        featured: true,
        views: true,
        downloadCount: true,
        publicationType: true,
        doi: true,
        conferenceName: true,
        bookTitle: true,
        institution: true,
      },
    });
  } catch {
    // DB unavailable — the client falls back to the static seed set.
  }
  return <PublicationsClient initialDbPublications={dbPublications} />;
}

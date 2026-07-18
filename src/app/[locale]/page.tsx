import type { Metadata } from "next";
import { pageAlternates, normalizeLocale } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import HomeClient from "./HomeClient";

// The homepage keeps the rich default title/description/OpenGraph from the root
// layout; we only override the canonical + hreflang so it stops inheriting the
// non-localized root canonical.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  return { alternates: pageAlternates(l, "") };
}

export const revalidate = 300;

export default async function HomePage() {
  const [projects, experiences, publications, settings] = await Promise.all([
    prisma.project
      .findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          titleFr: true,
          description: true,
          descriptionFr: true,
          technologies: true,
          category: true,
          featured: true,
        },
      })
      .catch(() => []),
    prisma.experience
      .findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          role: true,
          roleFr: true,
          organization: true,
          location: true,
          startDate: true,
          endDate: true,
          description: true,
          descriptionFr: true,
        },
      })
      .catch(() => []),
    prisma.publication
      .findMany({
        orderBy: { year: "desc" },
        select: {
          id: true,
          title: true,
          titleFr: true,
          abstract: true,
          abstractFr: true,
          authors: true,
          year: true,
          category: true,
          pdfUrl: true,
          featured: true,
        },
      })
      .catch(() => []),
    getSiteSettings(),
  ]);

  const visibility = settings.sectionVisibility as Record<string, boolean>;
  const cvUrl = typeof settings.cvFileUrl === "string" ? settings.cvFileUrl : "";

  return (
    <HomeClient
      initialProjects={projects}
      initialExperiences={experiences}
      initialPublications={publications}
      initialVisibility={visibility}
      initialCvUrl={cvUrl}
    />
  );
}

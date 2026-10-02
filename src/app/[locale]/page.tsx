import type { Metadata } from "next";
import { pageAlternates, normalizeLocale } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import HomeClient from "./HomeClient";
import { buildCapabilityData } from "@/lib/capabilities";
import { protectFiles } from "@/lib/publication-access";
import { projects as staticProjects } from "@/data/projects";
import { experiences as staticExperiences } from "@/data/experience";
import { publications as staticPublications } from "@/data/publications";
import {
  education as staticEducation,
  certifications as staticCertifications,
  skillCategories as staticSkillCategories,
} from "@/data/skills";

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
  const [projects, experiences, publications, settings, education, certifications, skillCategories] = await Promise.all([
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
          slug: true,
          year: true,
          category: true,
          pdfUrl: true,
          accessLevel: true,
          featured: true,
        },
      })
      .catch(() => []),
    getSiteSettings(),
    prisma.education
      .findMany({ orderBy: { sortOrder: "asc" }, select: { degree: true, institution: true, year: true } })
      .catch(() => []),
    prisma.certification
      .findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, issuer: true, year: true } })
      .catch(() => []),
    prisma.skillCategory
      .findMany({
        orderBy: { sortOrder: "asc" },
        select: { name: true, nameFr: true, skills: { select: { name: true } } },
      })
      .catch(() => []),
  ]);

  // Same fallback rule HomeClient applies: the DB when it has rows, the static
  // seed otherwise, so the charts always describe what the page itself shows.
  const capabilities = buildCapabilityData({
    roles: experiences.length ? experiences : staticExperiences,
    publications: publications.length ? publications : staticPublications,
    projects: projects.length ? projects : staticProjects,
    education: education.length ? education : staticEducation,
    certifications: certifications.length ? certifications : staticCertifications,
    skillCategories: skillCategories.length ? skillCategories : staticSkillCategories,
  });

  const visibility = settings.sectionVisibility as Record<string, boolean>;
  const cvUrl = typeof settings.cvFileUrl === "string" ? settings.cvFileUrl : "";

  return (
    <HomeClient
      initialProjects={projects}
      initialExperiences={experiences}
      initialPublications={publications.map((p) => protectFiles(p))}
      initialVisibility={visibility}
      initialCvUrl={cvUrl}
      capabilities={capabilities}
    />
  );
}

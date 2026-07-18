import { MetadataRoute } from "next";
import { publications } from "@/data/publications";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.konanamanidieudonne.org";

// Build hreflang alternates for a given path so search engines pair the en/fr
// versions (with an x-default fallback) instead of treating them as separate.
function langAlternates(path: string) {
  return {
    languages: {
      en: `${BASE_URL}/en${path}`,
      fr: `${BASE_URL}/fr${path}`,
      "x-default": `${BASE_URL}/en${path}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["en", "fr"];
  const pages = [
    { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/experience", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/services", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/projects", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/publications", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/store", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/research", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/dba", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/consulting", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/subscribe", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/qa", changeFrequency: "weekly" as const, priority: 0.5 },
    { path: "/contact", changeFrequency: "yearly" as const, priority: 0.6 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: langAlternates(page.path),
      });
    }
  }

  // Publication detail pages — union DB-managed publications with the static
  // seed set so both sources are advertised (deduped by slug).
  const pubSlugs = new Set<string>(publications.map((p) => p.slug));
  try {
    const dbPubs = await prisma.publication.findMany({ select: { slug: true } });
    for (const p of dbPubs) pubSlugs.add(p.slug);
  } catch {
    // Database might not be available during build
  }
  for (const locale of locales) {
    for (const slug of pubSlugs) {
      entries.push({
        url: `${BASE_URL}/${locale}/publications/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: langAlternates(`/publications/${slug}`),
      });
    }
  }

  // Bookstore detail pages (published only)
  try {
    const books = await prisma.book.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
    for (const locale of locales) {
      for (const book of books) {
        entries.push({
          url: `${BASE_URL}/${locale}/store/${book.slug}`,
          lastModified: book.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
          alternates: langAlternates(`/store/${book.slug}`),
        });
      }
    }
  } catch {
    // Database might not be available during build
  }

  // Blog posts from database
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    for (const locale of locales) {
      for (const post of posts) {
        entries.push({
          url: `${BASE_URL}/${locale}/blog/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
          alternates: langAlternates(`/blog/${post.slug}`),
        });
      }
    }
  } catch {
    // Database might not be available during build
  }

  return entries;
}

/**
 * Topic hubs: one landing page per publication category, built from the
 * catalogue itself (no hand-written copy). Each hub gathers the category's
 * publications, the store products and blog posts on the same subject, so
 * search engines and readers find one strong page per theme.
 */
import { prisma } from "./prisma";
import { slugify } from "./utils";
import { allPublications, type CatalogPublication } from "./ai-catalogue";

export interface Topic {
  slug: string;
  name: string;
  count: number;
  free: number;
  firstYear: number;
  lastYear: number;
}

function summarise(name: string, pubs: CatalogPublication[]): Topic {
  const years = pubs.map((p) => p.year);
  return {
    slug: slugify(name),
    name,
    count: pubs.length,
    free: pubs.filter((p) => p.access === "free").length,
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
  };
}

function groupByCategory(pubs: CatalogPublication[]) {
  const groups = new Map<string, CatalogPublication[]>();
  for (const p of pubs) {
    if (!p.category || !slugify(p.category)) continue;
    groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  }
  return groups;
}

/** All topics, largest first. */
export async function getTopics(): Promise<Topic[]> {
  const groups = groupByCategory(await allPublications());
  return [...groups].map(([name, pubs]) => summarise(name, pubs)).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getTopic(slug: string) {
  const groups = groupByCategory(await allPublications());
  const entry = [...groups].find(([name]) => slugify(name) === slug);
  if (!entry) return null;
  const [name, pubs] = entry;
  const [products, posts] = await Promise.all([
    prisma.book.findMany({
      where: { status: "PUBLISHED", OR: [{ category: { equals: name, mode: "insensitive" } }, { tags: { has: name } }] },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      take: 6,
      select: { slug: true, title: true, titleFr: true, kind: true, publicationYear: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true, category: { equals: name, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { slug: true, title: true, titleFr: true, createdAt: true },
    }),
  ]);
  return { topic: summarise(name, pubs), publications: [...pubs].sort((a, b) => b.year - a.year), products, posts };
}

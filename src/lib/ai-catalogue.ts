/**
 * The public catalogue, in one place, for machine readers: llms.txt and the
 * MCP server. Everything comes from the database (or the site's own copy in
 * messages/), so assistants quote what the site actually offers — nothing
 * here is written by hand. Only public data: no file URLs, no private fields.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { BASE_URL } from "./seo";
import { effectivePrice } from "./pricing";
import { publications as staticPublications } from "@/data/publications";
import en from "../../messages/en.json";

export const SITE = {
  name: en.hero.name,
  roles: en.hero.roles,
  summary: en.hero.description,
  url: BASE_URL,
};

export interface CatalogPublication {
  slug: string;
  title: string;
  year: number;
  category: string | null;
  type: string;
  abstract: string;
  access: "free" | "subscription";
  url: string;
}

const toPub = (p: { slug: string; title: string; year: number; category?: string | null; publicationType?: string | null; abstract: string; accessLevel?: string | null }): CatalogPublication => ({
  slug: p.slug,
  title: p.title,
  year: p.year,
  category: p.category ?? null,
  type: p.publicationType ?? "OTHER",
  abstract: p.abstract,
  access: p.accessLevel === "GATED" ? "subscription" : "free",
  url: `${BASE_URL}/en/publications/${p.slug}`,
});

/** Same source rule as the publications page: the database, else the seed set. */
async function allPublications(): Promise<CatalogPublication[]> {
  const rows = await prisma.publication.findMany({ orderBy: [{ year: "desc" }, { createdAt: "desc" }] });
  return rows.length ? rows.map(toPub) : staticPublications.map(toPub).sort((a, b) => b.year - a.year);
}

export async function searchPublications(opts: { query?: string; category?: string; year?: number; limit?: number }) {
  const q = (opts.query || "").trim().toLowerCase().slice(0, 100);
  const all = await allPublications();
  const hits = all.filter(
    (p) =>
      (!q || p.title.toLowerCase().includes(q) || p.abstract.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q)) &&
      (!opts.category || (p.category || "").toLowerCase() === opts.category.toLowerCase()) &&
      (!opts.year || p.year === opts.year)
  );
  return { total: hits.length, results: hits.slice(0, Math.min(50, Math.max(1, opts.limit ?? 10))) };
}

export async function getPublication(slug: string) {
  return (await allPublications()).find((p) => p.slug === slug) ?? null;
}

const money = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency}`;

/** `kind` is a ProductKind, or "BUNDLE" for bundles only. */
export async function listProducts(kind?: string) {
  const k = kind?.toUpperCase();
  const where: Prisma.BookWhereInput = { status: "PUBLISHED", ...(k ? { kind: k as Prisma.BookWhereInput["kind"] } : {}) };
  const [books, bundles] = await Promise.all([
    k === "BUNDLE" ? Promise.resolve([]) : prisma.book.findMany({ where, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] }),
    k && k !== "BUNDLE" ? Promise.resolve([]) : prisma.bundle.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
  ]);
  return [
    ...books.map((b) => {
      const p = effectivePrice(b);
      return {
        kind: b.kind.toLowerCase(),
        slug: b.slug,
        title: b.title,
        description: b.description.slice(0, 500),
        year: b.publicationYear,
        price: b.payWhatYouWant ? `from ${money(p.priceCents, b.currency)} (pay what you want)` : money(p.priceCents, b.currency),
        url: `${BASE_URL}/en/store/${b.slug}`,
      };
    }),
    ...bundles.map((b) => ({
      kind: "bundle",
      slug: b.slug,
      title: b.title,
      description: b.description.slice(0, 500),
      year: null,
      price: money(b.priceCents, b.currency),
      url: `${BASE_URL}/en/store/bundles/${b.slug}`,
    })),
  ];
}

export async function listServices() {
  const rows = await prisma.servicePackage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((s) => ({
    slug: s.slug,
    title: s.title,
    description: s.description.slice(0, 500),
    duration_minutes: s.durationMinutes,
    price: s.priceCents === 0 ? "free" : money(s.priceCents, s.currency),
    book_url: `${BASE_URL}/en/book?package=${encodeURIComponent(s.slug)}`,
  }));
}

export async function listPosts(limit = 20) {
  const rows = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { slug: true, title: true, excerpt: true, createdAt: true },
  });
  return rows.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, date: p.createdAt.toISOString().slice(0, 10), url: `${BASE_URL}/en/blog/${p.slug}` }));
}

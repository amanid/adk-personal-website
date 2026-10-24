/**
 * House ads: the site's own books and publications, promoted automatically
 * across its pages to turn reading into visits and orders.
 *
 * Nothing is curated by hand. Every placement asks for N items for a context
 * (the page's kind, category and tags) and gets the best matches from the
 * published catalogue: same category, shared tags, featured, on launch offer,
 * recent — with a daily rotation so the same page does not always show the
 * same titles. Clicks set a 30-day first-party cookie that is written to the
 * order as its source, so the analytics can say which placement sells.
 */
import { cache } from "react";
import { prisma } from "./prisma";
import { effectivePrice } from "./pricing";
import { publications as staticPublications } from "@/data/publications";

export type PromoKind = "book" | "publication";

export interface PromoItem {
  kind: PromoKind;
  slug: string;
  title: string;
  titleFr: string | null;
  blurb: string;
  blurbFr: string | null;
  /** Site path (locale added by the Link component). */
  href: string;
  coverUrl: string | null;
  /** Books: the price in force; publications: null. */
  priceCents: number | null;
  regularCents: number | null;
  currency: string;
  saleEndsAt: string | null;
  payWhatYouWant: boolean;
  /** Books: the product kind (BOOK, REPORT, DATASET…); publications: "PUBLICATION". */
  productKind: string;
  gated: boolean;
  year: number;
  category: string | null;
  tags: string[];
  featured: boolean;
  createdAt: string;
}

export interface PromoContext {
  kind: "home" | "blog" | "publication" | "store" | "list";
  slug?: string | null;
  category?: string | null;
  tags?: string[] | null;
}

export interface PromoWant {
  books?: number;
  publications?: number;
  /** Only items sharing the context's category or a tag: for placements
   *  that claim a relationship ("the research behind this title"). */
  requireRelevance?: boolean;
}

export interface PromoSet {
  books: PromoItem[];
  publications: PromoItem[];
}

const clip = (text: string | null | undefined, max = 180) => {
  const clean = (text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
};

/** Published books and publications, once per request. */
export const loadPromoPool = cache(async (): Promise<PromoItem[]> => {
  const now = new Date();
  let books: PromoItem[] = [];
  let pubs: PromoItem[] = [];
  try {
    const rows = await prisma.book.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        slug: true, title: true, titleFr: true, subtitle: true, subtitleFr: true, keyInsights: true, keyInsightsFr: true,
        description: true, descriptionFr: true, kind: true, publicationYear: true, category: true, tags: true, featured: true,
        priceCents: true, salePriceCents: true, saleStartsAt: true, saleEndsAt: true, payWhatYouWant: true, currency: true,
        coverImageId: true, createdAt: true,
      },
    });
    books = rows.map((b) => {
      const price = effectivePrice(b, now);
      return {
        kind: "book",
        slug: b.slug,
        title: b.title,
        titleFr: b.titleFr,
        blurb: clip(b.keyInsights[0] || b.subtitle || b.description),
        blurbFr: b.keyInsightsFr[0] || b.subtitleFr || (b.descriptionFr ? clip(b.descriptionFr) : null),
        href: `/store/${b.slug}`,
        coverUrl: b.coverImageId ? `/api/uploads/${b.coverImageId}` : null,
        priceCents: price.priceCents,
        regularCents: price.regularCents,
        currency: b.currency,
        saleEndsAt: price.saleEndsAt ? price.saleEndsAt.toISOString() : null,
        payWhatYouWant: price.payWhatYouWant,
        productKind: b.kind,
        gated: false,
        year: b.publicationYear,
        category: b.category,
        tags: b.tags,
        featured: b.featured,
        createdAt: b.createdAt.toISOString(),
      };
    });
  } catch {
    books = [];
  }
  try {
    const rows = await prisma.publication.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 300,
      select: { slug: true, title: true, titleFr: true, abstract: true, abstractFr: true, year: true, category: true, tags: true, featured: true, accessLevel: true, createdAt: true },
    });
    pubs = rows.map((p) => ({
      kind: "publication",
      slug: p.slug,
      title: p.title,
      titleFr: p.titleFr,
      blurb: clip(p.abstract),
      blurbFr: p.abstractFr ? clip(p.abstractFr) : null,
      href: `/publications/${p.slug}`,
      coverUrl: null,
      priceCents: null,
      regularCents: null,
      currency: "USD",
      saleEndsAt: null,
      payWhatYouWant: false,
      productKind: "PUBLICATION",
      gated: p.accessLevel === "GATED",
      year: p.year,
      category: p.category,
      tags: p.tags,
      featured: p.featured,
      createdAt: p.createdAt.toISOString(),
    }));
  } catch {
    pubs = [];
  }
  if (!pubs.length) {
    pubs = staticPublications.map((p) => ({
      kind: "publication",
      slug: p.slug,
      title: p.title,
      titleFr: p.titleFr ?? null,
      blurb: clip(p.abstract),
      blurbFr: p.abstractFr ? clip(p.abstractFr) : null,
      href: `/publications/${p.slug}`,
      coverUrl: null,
      priceCents: null,
      regularCents: null,
      currency: "USD",
      saleEndsAt: null,
      payWhatYouWant: false,
      productKind: "PUBLICATION",
      gated: p.accessLevel === "GATED",
      year: p.year,
      category: p.category ?? null,
      tags: p.tags ?? [],
      featured: !!p.featured,
      createdAt: `${p.year}-01-01T00:00:00.000Z`,
    }));
  }
  return [...books, ...pubs];
});

const norm = (s: string | null | undefined) => (s || "").trim().toLowerCase();

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Day number, so the rotation changes once a day and matches between render passes. */
export const dailySeed = (now = new Date()) => Math.floor(now.getTime() / 86_400_000);

/** Points for sharing the context's category or tags; 0 when unrelated. */
export function relevance(item: PromoItem, ctx: PromoContext): number {
  let s = 0;
  const cat = norm(ctx.category);
  if (cat && norm(item.category) === cat) s += 4;
  const tags = new Set((ctx.tags || []).map(norm).filter(Boolean));
  if (tags.size) s += Math.min(9, item.tags.filter((t) => tags.has(norm(t))).length * 3);
  return s;
}

export function scorePromo(item: PromoItem, ctx: PromoContext, seed: number, now = new Date()): number {
  let s = relevance(item, ctx);
  if (item.featured) s += 2;
  if (item.regularCents) s += 3; // on launch offer
  const ageDays = (now.getTime() - new Date(item.createdAt).getTime()) / 86_400_000;
  if (ageDays <= 60) s += 2;
  else if (ageDays <= 180) s += 1;
  // A free report is the better invitation to read; a priced one is the product.
  if (item.kind === "publication" && !item.gated) s += 2;
  // Daily rotation: a fraction, so it only orders equals and near-equals.
  s += ((hash(item.slug) + seed) % 7) / 10;
  return s;
}

/** The best `want` items of each kind for the context, excluding the page's own item. */
export function pickPromos(pool: PromoItem[], ctx: PromoContext, want: PromoWant, seed = dailySeed(), now = new Date()): PromoSet {
  const self = norm(ctx.slug);
  const rank = (kind: PromoKind, n: number) =>
    n <= 0
      ? []
      : pool
          .filter((i) => i.kind === kind && norm(i.slug) !== self)
          .filter((i) => !want.requireRelevance || relevance(i, ctx) > 0)
          .map((i) => ({ i, s: scorePromo(i, ctx, seed, now) }))
          .sort((a, b) => b.s - a.s || a.i.title.localeCompare(b.i.title))
          .slice(0, n)
          .map((x) => x.i);
  return { books: rank("book", want.books ?? 0), publications: rank("publication", want.publications ?? 0) };
}

export async function getPromos(ctx: PromoContext, want: PromoWant): Promise<PromoSet> {
  return pickPromos(await loadPromoPool(), ctx, want);
}

/* ── Announcement bar ─────────────────────────────────────────────────────── */

export interface Announcement {
  kind: "sale" | "new";
  item: PromoItem;
}

const NEW_DAYS = 45;

/**
 * What the site-wide bar says, from the data alone: a book on launch offer
 * first, otherwise a book published in the last 45 days, otherwise nothing.
 */
export const getAnnouncement = cache(async (now = new Date()): Promise<Announcement | null> => {
  const books = (await loadPromoPool()).filter((i) => i.kind === "book");
  const sale = books.filter((b) => b.regularCents).sort((a, b) => (a.saleEndsAt || "9").localeCompare(b.saleEndsAt || "9"))[0];
  if (sale) return { kind: "sale", item: sale };
  const fresh = books
    .filter((b) => now.getTime() - new Date(b.createdAt).getTime() <= NEW_DAYS * 86_400_000)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return fresh ? { kind: "new", item: fresh } : null;
});

/* ── Attribution ──────────────────────────────────────────────────────────── */

export const PROMO_COOKIE = "adk_src";
export const PROMO_COOKIE_DAYS = 30;
const SOURCE_RE = /^promo:[a-z0-9-]{1,40}:[a-z0-9-]{1,120}$/;

/** "promo:<placement>:<slug>" for a click, validated. */
export function promoSource(placement: string, slug: string): string | null {
  const v = `promo:${placement}:${slug}`;
  return SOURCE_RE.test(v) ? v : null;
}

/** The house-ad source recorded by the browser, or null. Read from the Cookie header. */
export function promoSourceFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie") || "";
  const m = header.match(new RegExp(`(?:^|;\\s*)${PROMO_COOKIE}=([^;]+)`));
  if (!m) return null;
  let v = "";
  try {
    v = decodeURIComponent(m[1]).trim();
  } catch {
    return null;
  }
  return SOURCE_RE.test(v) ? v : null;
}

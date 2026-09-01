import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { publications } from "@/data/publications";
import { renderShareCard } from "@/lib/og-card";
import { renderPdfCover } from "@/lib/cover-image";

// Prisma, fs and the PDF rasteriser are all Node-only.
export const runtime = "nodejs";

/**
 * Rasterising is far more expensive than serving a card without artwork, and a
 * crawler hitting a cold cache should never risk the instance. Anything above
 * this falls back to the branded lettermark card instead.
 */
const MAX_OG_PDF_BYTES = 6 * 1024 * 1024;

/** Lower than the admin-upload default: less canvas memory per render. */
const OG_RASTER_SCALE = 1.0;

interface ResolvedPublication {
  title: string;
  journal: string | null;
  category: string | null;
  year: number;
  authors: string[];
  pdfUrl: string | null;
}

async function resolvePublication(
  slug: string,
  fr: boolean
): Promise<ResolvedPublication | null> {
  // Static publications first (no DB dependency).
  const stat = publications.find((p) => p.slug === slug);
  if (stat) {
    return {
      title: (fr && stat.titleFr) || stat.title,
      journal: stat.journal ?? null,
      category: stat.category ?? null,
      year: stat.year,
      authors: stat.authors ?? [],
      pdfUrl: stat.pdfUrl ?? null,
    };
  }

  try {
    const db = await prisma.publication.findUnique({
      where: { slug },
      select: {
        title: true,
        titleFr: true,
        journal: true,
        category: true,
        year: true,
        authors: true,
        pdfUrl: true,
      },
    });
    if (!db) return null;
    return {
      title: (fr && db.titleFr) || db.title,
      journal: db.journal,
      category: db.category,
      year: db.year,
      authors: db.authors,
      pdfUrl: db.pdfUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Read the publication's PDF bytes.
 *
 * Only two shapes are trusted: a file under `public/publications` (static
 * publications) and an `/api/uploads/<id>` reference (admin uploads). Anything
 * else — including absolute URLs — is ignored rather than fetched, so an admin
 * mistake can't turn this route into an SSRF vector.
 */
async function loadPdf(pdfUrl: string | null): Promise<Buffer | null> {
  if (!pdfUrl) return null;

  const uploadId = pdfUrl.match(/^\/api\/uploads\/([A-Za-z0-9_-]+)$/)?.[1];
  if (uploadId) {
    try {
      const upload = await prisma.upload.findUnique({
        where: { id: uploadId },
        select: { data: true },
      });
      return upload?.data ? Buffer.from(upload.data) : null;
    } catch {
      return null;
    }
  }

  if (!pdfUrl.startsWith("/publications/")) return null;
  try {
    const root = path.join(process.cwd(), "public", "publications");
    const decoded = decodeURIComponent(pdfUrl.slice("/publications/".length));
    const full = path.join(root, decoded);
    // Reject traversal outside the publications directory.
    if (path.relative(root, full).startsWith("..")) return null;
    return await readFile(full);
  } catch {
    return null;
  }
}

/**
 * Rendered covers are cached on disk as well as in memory.
 *
 * The in-memory map keeps the hot path allocation-free but is bounded, and a
 * restart (or an eviction) would otherwise mean rasterising all over again. The
 * disk copy is small, survives both, and turns a repeat crawl into a file read.
 * Render's filesystem is ephemeral, which is fine — this is a cache, and a cold
 * one costs one render.
 */
const COVER_CACHE_MAX = 24;
const coverCache = new Map<string, string | null>();

function diskCachePath(slug: string): string {
  const key = crypto.createHash("sha256").update(slug).digest("hex").slice(0, 32);
  return path.join(os.tmpdir(), "adk-og-covers", `${key}.jpg`);
}

function remember(slug: string, uri: string | null): string | null {
  if (coverCache.size >= COVER_CACHE_MAX) {
    const oldest = coverCache.keys().next().value;
    if (oldest !== undefined) coverCache.delete(oldest);
  }
  coverCache.set(slug, uri);
  return uri;
}

async function publicationCover(slug: string, pdfUrl: string | null): Promise<string | null> {
  if (coverCache.has(slug)) return coverCache.get(slug) ?? null;

  const cacheFile = diskCachePath(slug);
  try {
    const cached = await readFile(cacheFile);
    return remember(slug, `data:image/jpeg;base64,${cached.toString("base64")}`);
  } catch {
    // Not cached yet — fall through and render it.
  }

  const pdf = await loadPdf(pdfUrl);
  if (!pdf || pdf.length > MAX_OG_PDF_BYTES) return remember(slug, null);

  const cover = await renderPdfCover(pdf, { scale: OG_RASTER_SCALE });
  if (!cover) return remember(slug, null);

  // Best-effort persist; a failure here only costs a future re-render.
  try {
    await mkdir(path.dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, cover.data);
  } catch {
    // ignore
  }

  return remember(slug, `data:${cover.mimeType};base64,${cover.data.toString("base64")}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const fr = request.nextUrl.searchParams.get("locale") === "fr";

  const pub = await resolvePublication(slug, fr);
  if (!pub) return new Response("Not found", { status: 404 });

  const authors = pub.authors.length ? pub.authors.join(", ") : "KONAN Amani Dieudonné";

  return renderShareCard({
    eyebrow: (pub.category || (fr ? "Publication" : "Publication")).toUpperCase(),
    title: pub.title,
    subtitle: pub.journal,
    meta: `${authors} · ${pub.year}`,
    highlight: null,
    cover: await publicationCover(slug, pub.pdfUrl),
  });
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { publications } from "@/data/publications";
import { renderShareCard } from "@/lib/og-card";
import { renderPdfCover } from "@/lib/cover-image";

// Prisma, fs and the PDF rasteriser are all Node-only.
export const runtime = "nodejs";

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

// Rasterising a PDF page is expensive; memoise per slug for the process
// lifetime. Bounded so a large catalogue can't grow the heap without limit.
const COVER_CACHE_MAX = 40;
const coverCache = new Map<string, string | null>();

async function publicationCover(slug: string, pdfUrl: string | null): Promise<string | null> {
  if (coverCache.has(slug)) return coverCache.get(slug) ?? null;

  const pdf = await loadPdf(pdfUrl);
  const cover = pdf ? await renderPdfCover(pdf) : null;
  const uri = cover ? `data:${cover.mimeType};base64,${cover.data.toString("base64")}` : null;

  if (coverCache.size >= COVER_CACHE_MAX) {
    const oldest = coverCache.keys().next().value;
    if (oldest !== undefined) coverCache.delete(oldest);
  }
  coverCache.set(slug, uri);
  return uri;
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

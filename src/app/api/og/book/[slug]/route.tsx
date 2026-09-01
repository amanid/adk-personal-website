import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderShareCard } from "@/lib/og-card";
import { formatMoney } from "@/lib/currency";

// Prisma + Buffer are unavailable on the edge runtime.
export const runtime = "nodejs";

/** Load the cover bytes and inline them as a data URI (satori can't fetch relative URLs). */
async function coverDataUri(coverImageId: string | null): Promise<string | null> {
  if (!coverImageId) return null;
  try {
    const upload = await prisma.upload.findUnique({
      where: { id: coverImageId },
      select: { data: true, mimeType: true },
    });
    if (!upload?.data) return null;
    const mime = /^image\//.test(upload.mimeType) ? upload.mimeType : "image/jpeg";
    return `data:${mime};base64,${Buffer.from(upload.data).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const fr = request.nextUrl.searchParams.get("locale") === "fr";

  const book = await prisma.book.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      titleFr: true,
      subtitle: true,
      subtitleFr: true,
      author: true,
      publicationYear: true,
      category: true,
      priceCents: true,
      currency: true,
      coverImageId: true,
    },
  });

  if (!book) return new Response("Not found", { status: 404 });

  return renderShareCard({
    eyebrow: book.category ? book.category.toUpperCase() : fr ? "OUVRAGE" : "BOOK",
    title: (fr && book.titleFr) || book.title,
    subtitle: (fr && book.subtitleFr) || book.subtitle,
    meta: `${book.author} · ${book.publicationYear}`,
    highlight:
      book.priceCents === 0
        ? fr
          ? "Gratuit"
          : "Free"
        : formatMoney(book.priceCents, book.currency),
    cover: await coverDataUri(book.coverImageId),
  });
}

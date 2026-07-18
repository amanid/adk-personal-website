import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Secure download endpoint. A download is served only when:
 *  - the grant token exists,
 *  - the parent order is PAID,
 *  - the grant has not expired, and
 *  - the per-item download limit has not been reached.
 * Any failure returns a generic 404 to avoid token/enumeration leakage.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = rateLimit(request, { limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  const notFound = () =>
    NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { token } = await params;
    if (!token) return notFound();

    const grant = await prisma.downloadGrant.findUnique({
      where: { token },
      include: { order: { select: { status: true } } },
    });

    if (!grant) return notFound();
    if (grant.order.status !== "PAID") return notFound();
    if (grant.expiresAt.getTime() < Date.now()) return notFound();
    if (grant.downloadCount >= grant.maxDownloads) {
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 403 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: grant.bookId },
      select: { fileId: true, fileName: true, fileMimeType: true, title: true },
    });
    if (!book?.fileId) return notFound();

    const asset = await prisma.bookAsset.findUnique({ where: { id: book.fileId } });
    if (!asset) return notFound();

    // Atomically count the download (guard against exceeding the limit under races).
    const updated = await prisma.downloadGrant.updateMany({
      where: { token, downloadCount: { lt: grant.maxDownloads } },
      data: { downloadCount: { increment: 1 } },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Download limit reached" }, { status: 403 });
    }

    const safeName = (book.fileName || asset.filename || `${book.title}.pdf`).replace(
      /[^\w.\- ]/g,
      "_"
    );

    // Stream the Buffer straight through (no extra Uint8Array copy).
    return new NextResponse(asset.data, {
      headers: {
        "Content-Type": asset.mimeType || book.fileMimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(asset.size || asset.data.length),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return notFound();
  }
}

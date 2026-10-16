import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findAsset, readAssetRange, streamAsset } from "@/lib/asset-store";
import { buildLicenceUpdate } from "@/lib/pdf-license";
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
      include: { order: { select: { status: true, email: true, name: true, orderNumber: true } } },
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

    const asset = await findAsset(book.fileId);
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

    // PDFs carry the buyer's name, email and order number in their document
    // properties (see lib/pdf-license), so a shared copy names its source.
    const mimeType = asset.mimeType || book.fileMimeType || "application/octet-stream";
    const isPdf = mimeType === "application/pdf" || safeName.toLowerCase().endsWith(".pdf");
    const licence = isPdf
      ? await buildLicenceUpdate(asset.size, (o, l) => readAssetRange(asset, o, l), {
          title: book.title,
          author: "KONAN Amani Dieudonné",
          buyerEmail: grant.order.email,
          buyerName: grant.order.name,
          orderNumber: grant.order.orderNumber,
        })
      : null;

    // Streamed piece by piece: a 50MB book never sits whole in memory.
    const body = licence ? withSuffix(streamAsset(asset), licence) : streamAsset(asset);
    return new NextResponse(body, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(asset.size + (licence?.length ?? 0)),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return notFound();
  }
}

/** The stream's bytes followed by `suffix`. */
function withSuffix(stream: ReadableStream<Uint8Array>, suffix: Uint8Array): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  let done = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (done) return;
      const r = await reader.read();
      if (r.done) {
        controller.enqueue(suffix);
        controller.close();
        done = true;
      } else {
        controller.enqueue(r.value);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

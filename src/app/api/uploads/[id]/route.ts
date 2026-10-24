import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGatedUpload } from "@/lib/publication-access";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Each hit loads the whole file into memory, so cap it per client.
    const limited = rateLimit(request, { limit: 120, windowSeconds: 60 });
    if (limited) return limited;

    const { id } = await params;
    if (id.length > 64) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Paid files are only served through /api/publications/<slug>/file, which
    // checks the subscription. Answer 404, not 403, so ids reveal nothing.
    if (await isGatedUpload(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only raster images may render inline. Anything else (SVG, HTML, PDF, …)
    // is forced to download so it cannot execute script on our own origin.
    const inlineTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ]);
    const isInlineImage = inlineTypes.has(upload.mimeType);
    const contentType = isInlineImage ? upload.mimeType : "application/octet-stream";
    const disposition = isInlineImage
      ? "inline"
      : `attachment; filename="${upload.filename.replace(/[^\w.\-]/g, "_")}"`;

    // Pass the Buffer straight through (no extra Uint8Array copy) to avoid
    // doubling memory per request.
    return new NextResponse(upload.data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "X-Content-Type-Options": "nosniff",
        // A day, not a year: an upload can later become the file of a gated
        // publication, and a year-long immutable copy in a shared cache would
        // keep serving it past the paywall.
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Upload serve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

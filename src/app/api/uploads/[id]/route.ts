import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        "Cache-Control": "public, max-age=31536000, immutable",
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

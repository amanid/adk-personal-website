import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { parseBookFile } from "@/lib/book-parser";
import { isAiEnrichConfigured } from "@/lib/ai-enrich";
import {
  processCoverImage,
  renderPdfCover,
  type ProcessedImage,
} from "@/lib/cover-image";

// The downloadable product file: books and reports, but also datasets,
// templates and toolkits. The stored MIME type comes from this map, never from
// the browser, and downloads are always served as attachments with nosniff.
const FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  epub: "application/epub+zip",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  json: "application/json",
  txt: "text/plain",
  md: "text/markdown",
  ipynb: "application/x-ipynb+json",
  parquet: "application/vnd.apache.parquet",
  dta: "application/x-stata-dta",
};
const ALLOWED_LABEL = Object.keys(FILE_TYPES).map((e) => e.toUpperCase()).join(", ");

// Cloudflare sits in front of this app and caps request bodies; the origin
// instance is far tighter still, since the bytes are held in memory and then
// re-encoded for the Postgres wire protocol. Reject oversized files up front
// with a readable message rather than letting the proxy return an HTML page.
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export const runtime = "nodejs";

// Parsing + rasterising a cover has to finish well inside the proxy's 100s
// origin timeout; a timeout there is returned as HTML, not JSON. AI drafting is
// deliberately NOT done here — the client calls /api/admin/books/enrich next.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = FILE_TYPES[ext];
    if (!mimeType) {
      return NextResponse.json({ error: `Invalid file type. Allowed: ${ALLOWED_LABEL}` }, { status: 400 });
    }
    const isDocument = ext === "pdf" || ext === "epub";

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 50MB" },
        { status: 413 }
      );
    }

    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const asset = await prisma.bookAsset.create({
      data: {
        filename,
        mimeType,
        size: file.size,
        data: buffer,
      },
    });

    // Best-effort metadata extraction so the editor can auto-fill fields.
    let metadata: Record<string, unknown> | null = null;
    let coverImageId: string | null = null;
    // Only books/reports (PDF, EPUB) have metadata and a cover to extract.
    if (isDocument) {
      try {
        const parsed = await parseBookFile(buffer, file.name, mimeType);

        // Cover: use the EPUB's embedded cover, else rasterize the PDF's first page.
        // Always downscale to a small JPEG so serving it can't blow up memory.
        let cover: ProcessedImage | null = null;
        if (parsed.cover) {
          cover = await processCoverImage(parsed.cover.data);
        } else if (ext === "pdf") {
          cover = await renderPdfCover(buffer);
        }
        if (cover) {
          const created = await prisma.upload.create({
            data: {
              filename: `${randomUUID()}-cover.jpg`,
              mimeType: cover.mimeType,
              data: Buffer.from(cover.data),
            },
          });
          coverImageId = created.id;
        }

        // Don't ship the raw cover buffer back to the client.
        const { cover: _rawCover, ...rest } = parsed;
        void _rawCover;
        metadata = { ...rest };
      } catch (err) {
        console.error("Book metadata parse failed:", err);
      }
    }

    return NextResponse.json({
      fileId: asset.id,
      fileName: file.name,
      fileMimeType: asset.mimeType,
      size: asset.size,
      coverImageId,
      metadata,
      // Tells the editor to follow up with an AI drafting request. Doing it in
      // a second call keeps each request short enough to survive the proxy.
      aiPending: isAiEnrichConfigured(),
    });
  } catch (error) {
    console.error("Book upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

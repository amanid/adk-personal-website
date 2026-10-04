import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { MAX_FILE_SIZE, PART_SIZE, expectedParts } from "@/lib/asset-store";

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

export const runtime = "nodejs";

/**
 * Start a book-file upload. The browser then sends the file in 4MB pieces
 * (PUT /api/admin/books/upload/{id}?part=n) and finishes with a POST to the
 * same address, which checks every byte against the browser's SHA-256. No
 * request ever carries or holds more than one piece: on this site's 512MB
 * instance, a whole 20MB file in one request was enough to run out of memory.
 *
 * Body: { fileName, size }. The stored type comes from the extension, never
 * from the browser, and downloads are always served as attachments.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const fileName = typeof body?.fileName === "string" ? body.fileName.trim().slice(0, 255) : "";
    const size = Number(body?.size);
    if (!fileName) return NextResponse.json({ error: "No file name given" }, { status: 400 });
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const mimeType = FILE_TYPES[ext];
    if (!mimeType) {
      return NextResponse.json({ error: `Invalid file type. Allowed: ${ALLOWED_LABEL}` }, { status: 400 });
    }
    if (!Number.isInteger(size) || size <= 0) return NextResponse.json({ error: "The file is empty" }, { status: 400 });
    if (size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large. Maximum size: 50MB" }, { status: 413 });

    const asset = await prisma.bookAsset.create({
      data: { filename: `${randomUUID()}.${ext}`, mimeType, size, parts: expectedParts(size), complete: false },
      select: { id: true, parts: true },
    });
    return NextResponse.json({ fileId: asset.id, partSize: PART_SIZE, parts: asset.parts });
  } catch (error) {
    console.error("Book upload start error:", error);
    return NextResponse.json({ error: "The upload could not be started. Try again." }, { status: 500 });
  }
}

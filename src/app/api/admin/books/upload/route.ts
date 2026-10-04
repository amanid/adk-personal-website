import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { isAiEnrichConfigured } from "@/lib/ai-enrich";
import { docKind } from "@/lib/doc-facts";

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

// Storing only. Reading the file (facts, cover) and AI drafting are separate
// requests — /api/admin/books/analyse and /api/admin/books/enrich — so each
// stays well inside the proxy's 100s origin timeout and a big upload never
// shares its memory peak with pdf.js.
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

    return NextResponse.json({
      fileId: asset.id,
      fileName: file.name,
      fileMimeType: asset.mimeType,
      size: asset.size,
      // The editor follows up with /analyse when the file has facts or a
      // cover to read, then with /enrich when AI drafting is available.
      analysable: docKind(file.name, mimeType) !== "other",
      aiAvailable: isAiEnrichConfigured(),
    });
  } catch (error) {
    console.error("Book upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

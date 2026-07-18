import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { parseBookFile, extractBookText } from "@/lib/book-parser";
import { enrichBookMetadata } from "@/lib/ai-enrich";
import { sanitizeInput } from "@/lib/sanitize";

const ALLOWED_TYPES = ["application/pdf", "application/epub+zip"];
const ALLOWED_EXTENSIONS = ["pdf", "epub"];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB per file
const MAX_FILES = 20;

export const runtime = "nodejs";

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "book"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (await prisma.book.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

/**
 * Bulk-import one or many PDF/EPUB files. Each file is parsed and a DRAFT book is
 * created with the extracted metadata (and cover, for EPUB). The admin then sets
 * the price and publishes.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} per import.` },
        { status: 400 }
      );
    }

    const created: { id: string; title: string; slug: string }[] = [];
    const failed: { name: string; error: string }[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
        failed.push({ name: file.name, error: "Unsupported type (PDF/EPUB only)" });
        continue;
      }
      if (file.size > MAX_SIZE) {
        failed.push({ name: file.name, error: "File too large (max 100MB)" });
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());

        const asset = await prisma.bookAsset.create({
          data: {
            filename: `${randomUUID()}.${ext || "bin"}`,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            data: buffer,
          },
        });

        const meta = await parseBookFile(buffer, file.name, file.type);

        // AI enrichment: draft description + key insights (best-effort).
        try {
          const sampleText = await extractBookText(buffer, file.name, file.type);
          const ai = await enrichBookMetadata({
            title: meta.title,
            author: meta.author,
            existingDescription: meta.description,
            sampleText,
          });
          if (ai?.description) meta.description = ai.description;
          if (ai?.keyInsights.length) meta.keyInsights = ai.keyInsights;
        } catch (err) {
          console.error(`AI enrichment (bulk) failed for ${file.name}:`, err);
        }

        let coverImageId: string | null = null;
        if (meta.cover) {
          const cover = await prisma.upload.create({
            data: {
              filename: `${randomUUID()}-cover`,
              mimeType: meta.cover.mimeType,
              data: Buffer.from(meta.cover.data),
            },
          });
          coverImageId = cover.id;
        }

        const title = sanitizeInput(meta.title || file.name.replace(/\.[^.]+$/, ""));
        const slug = await uniqueSlug(slugify(title));

        const book = await prisma.book.create({
          data: {
            title,
            slug,
            description: meta.description
              ? sanitizeInput(meta.description)
              : `${title} — description pending.`,
            keyInsights: (meta.keyInsights || []).map(sanitizeInput),
            keyInsightsFr: [],
            author: meta.author ? sanitizeInput(meta.author) : undefined,
            publicationYear: meta.publicationYear || new Date().getFullYear(),
            isbn: meta.isbn || null,
            language: meta.language ? sanitizeInput(meta.language) : undefined,
            pageCount: meta.pageCount ?? null,
            tags: [],
            priceCents: 0,
            currency: "USD",
            coverImageId,
            fileId: asset.id,
            fileName: file.name,
            fileMimeType: asset.mimeType,
            status: "DRAFT",
          },
        });

        created.push({ id: book.id, title: book.title, slug: book.slug });
      } catch (err) {
        console.error(`Bulk import failed for ${file.name}:`, err);
        failed.push({ name: file.name, error: "Processing failed" });
      }
    }

    return NextResponse.json({ created, failed });
  } catch (error) {
    console.error("Bulk book import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

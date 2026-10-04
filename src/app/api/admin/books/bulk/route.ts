import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyseDocument, docKind } from "@/lib/doc-facts";
import { findAsset, readAsset } from "@/lib/asset-store";
import { storeDocumentCover } from "@/lib/book-analysis";
import { isAiEnrichConfigured } from "@/lib/ai-enrich";
import { sanitizeInput } from "@/lib/sanitize";

const DEFAULT_PRICE_CENTS = 5000; // $50

const MAX_FILES = 20;

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Stop starting new files once we are this far in. The proxy in front of this
 * app abandons an origin request at ~100s and answers the browser with an HTML
 * page, which the importer can only report as a JSON parse error. Returning a
 * partial-but-honest result well before that is far better: the admin sees what
 * landed and can re-run the import for the rest.
 */
const TIME_BUDGET_MS = 70_000;

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
 * Create DRAFT books from files already uploaded in pieces (the same upload
 * as the editor's). Body: { files: [{ fileId, fileName }] }. Each file is
 * read for its facts and cover (no AI, so this stays fast). The editor
 * then runs the grounded AI draft per book (/api/admin/books/[id]/enrich),
 * one request each, so no single request outlives the proxy timeout.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const files = (Array.isArray(body?.files) ? body.files : [])
      .filter((f: unknown): f is { fileId: string; fileName: string } =>
        typeof (f as { fileId?: unknown })?.fileId === "string" && typeof (f as { fileName?: unknown })?.fileName === "string")
      .map((f: { fileId: string; fileName: string }) => ({ fileId: f.fileId, name: f.fileName.slice(0, 255) }));

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} per import.` },
        { status: 400 }
      );
    }

    const created: { id: string; title: string; slug: string; notes: string[] }[] = [];
    const failed: { name: string; error: string }[] = [];
    const startedAt = Date.now();

    for (const file of files) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        failed.push({
          name: file.name,
          error: "Not processed — import time limit reached. Re-run the import for this file.",
        });
        continue;
      }

      try {
        const asset = await findAsset(file.fileId);
        if (!asset) {
          failed.push({ name: file.name, error: "The uploaded file was not found — upload it again." });
          continue;
        }
        if (docKind(asset.filename, asset.mimeType) === "other") {
          failed.push({ name: file.name, error: "Unsupported type (PDF, EPUB, Word or PowerPoint only)" });
          continue;
        }

        const { facts, cover } = await analyseDocument(await readAsset(asset), asset.filename, asset.mimeType, { consume: true });
        let coverImageId: string | null = null;
        if (cover) {
          const stored = await storeDocumentCover(cover);
          if (!("refused" in stored)) coverImageId = stored.coverImageId;
        }

        // A draft needs a title; when the file has none, its name stands in
        // until the admin edits it.
        const title = sanitizeInput(facts.title?.value || file.name.replace(/\.[^.]+$/, ""));
        const slug = await uniqueSlug(slugify(title));

        const book = await prisma.book.create({
          data: {
            title,
            slug,
            subtitle: facts.subtitle ? sanitizeInput(facts.subtitle.value) : null,
            description: facts.description
              ? sanitizeInput(facts.description.value)
              : `${title} — description pending.`,
            keyInsights: [],
            keyInsightsFr: [],
            author: facts.author ? sanitizeInput(facts.author.value) : undefined,
            publicationYear: facts.publicationYear?.value || new Date().getFullYear(),
            isbn: facts.isbn?.value || null,
            language: facts.language ? sanitizeInput(facts.language.value) : undefined,
            pageCount: facts.pageCount?.value ?? null,
            tags: (facts.tags?.value ?? []).map(sanitizeInput),
            priceCents: DEFAULT_PRICE_CENTS,
            currency: "USD",
            coverImageId,
            fileId: asset.id,
            fileName: file.name,
            fileMimeType: asset.mimeType,
            status: "DRAFT",
          },
        });

        // Say plainly which values are stand-ins rather than read from the file.
        const notes: string[] = [];
        if (!facts.title) notes.push("no title found in the file — its file name was used");
        if (!facts.publicationYear) notes.push(`no publication year found — set to ${book.publicationYear} as a placeholder`);
        if (!coverImageId) notes.push("no usable cover found — upload one");
        created.push({ id: book.id, title: book.title, slug: book.slug, notes });
      } catch (err) {
        console.error(`Bulk import failed for ${file.name}:`, err);
        failed.push({ name: file.name, error: "Processing failed" });
      }
    }

    return NextResponse.json({ created, failed, aiAvailable: isAiEnrichConfigured() });
  } catch (error) {
    console.error("Bulk book import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Bulk-delete books. Body: { ids?: string[], all?: boolean, force?: boolean }.
 * Books that appear in orders can't be removed without force (that would break
 * buyers' receipts/downloads); without force we refuse and report the count so
 * the admin can confirm. With force we also remove those order lines + grants.
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const all = body?.all === true;
    const force = body?.force === true;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((x: unknown): x is string => typeof x === "string")
      : [];

    if (!all && ids.length === 0) {
      return NextResponse.json({ error: "No books selected" }, { status: 400 });
    }

    const books = await prisma.book.findMany({
      where: all ? {} : { id: { in: ids } },
      select: { id: true, fileId: true, coverImageId: true },
    });
    if (books.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    const bookIds = books.map((b) => b.id);
    // A bundle would silently lose a title (and its buyers a download).
    const inBundles = await prisma.bundleItem.count({ where: { bookId: { in: bookIds } } });
    if (inBundles > 0) {
      return NextResponse.json(
        { error: "Some selected products are in bundles. Remove them from those bundles first." },
        { status: 409 }
      );
    }

    const sold = await prisma.orderItem.count({ where: { bookId: { in: bookIds } } });

    if (sold > 0 && !force) {
      return NextResponse.json(
        {
          error: `${sold} of the selected book${sold === 1 ? "" : "s"} appear${
            sold === 1 ? "s" : ""
          } in orders. Archive them to keep order history, or delete anyway to also remove those order lines and download links.`,
          ordersCount: sold,
          canForce: true,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.downloadGrant.deleteMany({ where: { bookId: { in: bookIds } } }),
      prisma.orderItem.deleteMany({ where: { bookId: { in: bookIds } } }),
      prisma.book.deleteMany({ where: { id: { in: bookIds } } }),
    ]);

    // Free orphaned files + covers.
    const assetIds = books.map((b) => b.fileId).filter((x): x is string => !!x);
    const coverIds = books.map((b) => b.coverImageId).filter((x): x is string => !!x);
    if (assetIds.length) await prisma.bookAsset.deleteMany({ where: { id: { in: assetIds } } });
    if (coverIds.length) await prisma.upload.deleteMany({ where: { id: { in: coverIds } } });

    return NextResponse.json({ deleted: bookIds.length });
  } catch (error) {
    console.error("Bulk book delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { analyseDocument } from "@/lib/doc-facts";
import { storeDocumentCover } from "@/lib/book-analysis";
import { findAsset, readAsset } from "@/lib/asset-store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Read an uploaded file's facts (title, subtitle, author, year, pages, ISBN,
 * language) and, when asked, its cover. No AI: every value is copied from the
 * file and returned with where it was found. Nothing is saved to the book;
 * the editor decides what to fill.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => ({}));
    const fileId = typeof body?.fileId === "string" ? body.fileId : null;
    if (!fileId) return NextResponse.json({ error: "No file given" }, { status: 400 });
    const asset = await findAsset(fileId);
    if (!asset) return NextResponse.json({ error: "File not found" }, { status: 404 });

    // The bytes are ours alone and unused afterwards, so pdf.js may take them
    // over rather than copy a file of up to 50MB.
    const result = await analyseDocument(await readAsset(asset), asset.filename, asset.mimeType, { consume: true });

    let cover: Awaited<ReturnType<typeof storeDocumentCover>> | null = null;
    if (body?.wantCover === true && result.cover) {
      cover = await storeDocumentCover(result.cover);
      if ("refused" in cover) result.facts.notes.push(`No cover taken from the file — ${cover.refused}.`);
      else if (cover.note) result.facts.notes.push(cover.note);
    }

    return NextResponse.json({
      facts: result.facts,
      cover: cover && !("refused" in cover) ? cover : null,
    });
  } catch (error) {
    console.error("Book analyse error:", error);
    return NextResponse.json({ error: "The file could not be read. Fill the fields by hand." }, { status: 500 });
  }
}

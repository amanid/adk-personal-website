import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { draftListing, isAiEnrichConfigured } from "@/lib/ai-enrich";
import { catalogueCategories, draftSource } from "@/lib/book-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/**
 * Draft (without saving) the listing prose for an uploaded file: description,
 * key insights, category, tags, and the other language's version. Every
 * claim is checked against the file's text; what fails is removed and listed
 * in `report`. Used by the editor after an upload and by "Draft with AI".
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    if (!isAiEnrichConfigured()) {
      return NextResponse.json({ error: "AI drafting is not configured (set OPENAI_API_KEY)." }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const fileId = str(body?.fileId);
    if (!fileId) return NextResponse.json({ error: "Upload the book file first, then draft with AI." }, { status: 400 });
    const asset = await prisma.bookAsset.findUnique({ where: { id: fileId } });
    if (!asset) return NextResponse.json({ error: "Book file not found" }, { status: 404 });

    const [source, categories] = await Promise.all([draftSource(asset.data, asset.filename, asset.mimeType), catalogueCategories()]);
    const draft = await draftListing({
      title: str(body?.title),
      subtitle: str(body?.subtitle),
      titleFr: str(body?.titleFr),
      subtitleFr: str(body?.subtitleFr),
      author: str(body?.author),
      existingDescription: str(body?.description),
      sampleText: source.text,
      language: source.language,
      categories,
    });
    if ("error" in draft) return NextResponse.json({ error: draft.error }, { status: 422 });
    return NextResponse.json(draft);
  } catch (error) {
    console.error("AI enrich endpoint error:", error);
    return NextResponse.json({ error: "AI drafting failed. Try again, or write the description yourself." }, { status: 500 });
  }
}

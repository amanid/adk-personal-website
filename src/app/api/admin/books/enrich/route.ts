import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractBookText } from "@/lib/book-parser";
import { enrichBookMetadata, isAiEnrichConfigured } from "@/lib/ai-enrich";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * On-demand AI drafting of a description + key insights from an already-uploaded
 * book file (BookAsset). Used by the admin editor's "Draft with AI" button.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAiEnrichConfigured()) {
      return NextResponse.json(
        { error: "AI drafting is not configured (set OPENAI_API_KEY)." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const fileId = typeof body?.fileId === "string" ? body.fileId : null;
    const title = typeof body?.title === "string" ? body.title : undefined;
    const author = typeof body?.author === "string" ? body.author : undefined;
    const existingDescription =
      typeof body?.description === "string" ? body.description : undefined;

    if (!fileId) {
      return NextResponse.json(
        { error: "Upload the book file first, then draft with AI." },
        { status: 400 }
      );
    }

    const asset = await prisma.bookAsset.findUnique({ where: { id: fileId } });
    if (!asset) {
      return NextResponse.json({ error: "Book file not found" }, { status: 404 });
    }

    const buffer = Buffer.from(asset.data);
    const sampleText = await extractBookText(buffer, asset.filename, asset.mimeType);

    const ai = await enrichBookMetadata({ title, author, existingDescription, sampleText });
    if (!ai) {
      return NextResponse.json(
        { error: "Could not generate a draft from this file. Try editing manually." },
        { status: 422 }
      );
    }

    return NextResponse.json(ai);
  } catch (error) {
    console.error("AI enrich endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

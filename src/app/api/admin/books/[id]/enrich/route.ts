import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enrichBookById } from "@/lib/book-enrich";

export const runtime = "nodejs";

/**
 * Draft and SAVE catalogue copy for one book from its own text.
 *
 * Deliberately one book per request. Extracting a book's text and waiting on
 * the model takes tens of seconds, so a single "enrich everything" request
 * would run past the proxy's ~100s origin timeout and come back as an HTML
 * error page. The admin UI drives the catalogue by calling this per book,
 * which also makes the run resumable and lets it report progress.
 *
 * (/api/admin/books/enrich is the sibling that drafts WITHOUT saving, for the
 * editor's "Draft with AI" button.)
 */
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const overwrite = body?.overwrite === true;

    const result = await enrichBookById(id, { overwrite });

    if (result.status === "failed") {
      return NextResponse.json({ error: result.reason }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Book enrich error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

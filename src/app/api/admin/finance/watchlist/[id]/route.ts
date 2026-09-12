import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";

export const runtime = "nodejs";

async function adminOnly() {
  const session = await auth();
  const ok = session && (session.user as { role?: string })?.role === "ADMIN";
  return ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Edit an entry's label, note or ordering. The symbol itself is immutable. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminOnly();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body?.name === "string") data.name = sanitizeInput(body.name).slice(0, 120);
    if (typeof body?.notes === "string") {
      data.notes = body.notes.trim() ? sanitizeInput(body.notes).slice(0, 500) : null;
    }
    if (Number.isFinite(body?.sortOrder)) data.sortOrder = Number(body.sortOrder);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const item = await prisma.watchlistItem.update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Watchlist PATCH error:", error);
    return NextResponse.json({ error: "Could not update the instrument" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminOnly();
  if (denied) return denied;

  try {
    const { id } = await params;
    await prisma.watchlistItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Watchlist DELETE error:", error);
    return NextResponse.json({ error: "Could not remove the instrument" }, { status: 500 });
  }
}

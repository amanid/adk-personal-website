import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { fetchChartQuote } from "@/lib/yahoo-chart";

export const runtime = "nodejs";
export const maxDuration = 60;

async function adminOnly() {
  const session = await auth();
  const ok = session && (session.user as { role?: string })?.role === "ADMIN";
  return ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Update a position: edit its note, or close it.
 *
 * Closing records the price at that moment, which fixes the realised result —
 * a closed position must not keep moving with the market afterwards. Reopening
 * clears both the close date and price together, so the two can never disagree.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminOnly();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body?.notes === "string") {
      data.notes = body.notes.trim() ? sanitizeInput(body.notes).slice(0, 500) : null;
    }

    if (body?.action === "close") {
      if (existing.closedAt) {
        return NextResponse.json({ error: "That position is already closed." }, { status: 400 });
      }
      let closePrice = Number(body?.closePrice);
      if (!Number.isFinite(closePrice) || closePrice <= 0) {
        const quote = await fetchChartQuote(existing.symbol, 10000);
        if (!quote || quote.price === null) {
          return NextResponse.json(
            { error: "No live price available — enter the closing price manually." },
            { status: 404 }
          );
        }
        closePrice = quote.price;
      }
      data.closePrice = closePrice;
      data.closedAt = new Date();
    }

    if (body?.action === "reopen") {
      data.closedAt = null;
      data.closePrice = null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const position = await prisma.position.update({ where: { id }, data });
    return NextResponse.json({ position });
  } catch (error) {
    console.error("Position PATCH error:", error);
    return NextResponse.json({ error: "Could not update the position" }, { status: 500 });
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
    await prisma.position.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Position DELETE error:", error);
    return NextResponse.json({ error: "Could not delete the position" }, { status: 500 });
  }
}

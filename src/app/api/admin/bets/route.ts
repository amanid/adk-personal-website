import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { betStats } from "@/lib/bets";

export const dynamic = "force-dynamic";

const betInputSchema = z.object({
  bookmaker: z.string().trim().min(1).max(60),
  sport: z.string().max(60).optional().or(z.literal("")),
  event: z.string().trim().min(1).max(200),
  market: z.string().max(120).optional().or(z.literal("")),
  selection: z.string().trim().min(1).max(200),
  oddsMilli: z.number().int().min(1001, "Odds must be above 1.00").max(1_000_000),
  stakeCents: z.number().int().min(1).max(1_000_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  notes: z.string().max(1000).optional().or(z.literal("")),
  placedAt: z.string().datetime().optional(),
});

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const bets = await prisma.betEntry.findMany({ orderBy: { placedAt: "desc" }, take: 1000 });
  const byBookmaker = [...new Set(bets.map((b) => b.bookmaker))].map((bm) => ({
    bookmaker: bm,
    stats: betStats(bets.filter((b) => b.bookmaker === bm)),
  }));
  return NextResponse.json({ bets, stats: betStats(bets), byBookmaker });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = betInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const bet = await prisma.betEntry.create({
    data: {
      bookmaker: d.bookmaker,
      sport: d.sport || null,
      event: d.event,
      market: d.market || null,
      selection: d.selection,
      oddsMilli: d.oddsMilli,
      stakeCents: d.stakeCents,
      currency: d.currency,
      notes: d.notes || null,
      ...(d.placedAt ? { placedAt: new Date(d.placedAt) } : {}),
    },
  });
  return NextResponse.json({ bet }, { status: 201 });
}

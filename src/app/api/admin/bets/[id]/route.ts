import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { winningReturn } from "@/lib/bets";

const settleSchema = z.object({
  status: z.enum(["OPEN", "WON", "LOST", "VOID", "CASHED_OUT"]),
  /** Required for a cash-out; optional for a win (defaults to stake × odds). */
  returnCents: z.number().int().min(0).max(100_000_000_000).nullable().optional(),
});

/** Settle (or re-open) a bet. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const parsed = settleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const bet = await prisma.betEntry.findUnique({ where: { id } });
  if (!bet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { status } = parsed.data;
  if (status === "CASHED_OUT" && parsed.data.returnCents == null) {
    return NextResponse.json({ error: "Enter the cash-out amount." }, { status: 400 });
  }
  const returnCents =
    status === "WON" ? parsed.data.returnCents ?? winningReturn(bet.stakeCents, bet.oddsMilli)
    : status === "CASHED_OUT" ? parsed.data.returnCents!
    : status === "VOID" ? bet.stakeCents
    : status === "LOST" ? 0
    : null;
  const updated = await prisma.betEntry.update({
    where: { id },
    data: { status, returnCents, settledAt: status === "OPEN" ? null : new Date() },
  });
  return NextResponse.json({ bet: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.betEntry.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

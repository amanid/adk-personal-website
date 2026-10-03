import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { commissionActionSchema } from "@/lib/validations";

/**
 * Commission workflow: approve (only once the refund window has passed),
 * mark paid (after you've sent the money), or void.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = commissionActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const { action, ids, note } = parsed.data;
  const now = new Date();

  if (action === "approve") {
    const res = await prisma.affiliateCommission.updateMany({
      where: { id: { in: ids }, status: "PENDING", holdUntil: { lte: now } },
      data: { status: "APPROVED", approvedAt: now },
    });
    const skipped = ids.length - res.count;
    return NextResponse.json({
      message: `${res.count} approved.${skipped ? ` ${skipped} skipped (still in the refund window, or not pending).` : ""}`,
    });
  }
  if (action === "pay") {
    const res = await prisma.affiliateCommission.updateMany({
      where: { id: { in: ids }, status: "APPROVED" },
      data: { status: "PAID", paidAt: now, payoutNote: note || null },
    });
    const skipped = ids.length - res.count;
    return NextResponse.json({
      message: `${res.count} marked paid.${skipped ? ` ${skipped} skipped (only approved commissions can be paid).` : ""}`,
    });
  }
  const res = await prisma.affiliateCommission.updateMany({
    where: { id: { in: ids }, status: { in: ["PENDING", "APPROVED"] } },
    data: { status: "VOID" },
  });
  return NextResponse.json({ message: `${res.count} voided.` });
}

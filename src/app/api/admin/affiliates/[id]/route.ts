import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { affiliateAdminUpdateSchema } from "@/lib/validations";
import { sendAffiliateWelcome } from "@/lib/affiliate-notify";

export const runtime = "nodejs";

/** Approve / suspend / reject an affiliate, or change their rate. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const parsed = affiliateAdminUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const before = await prisma.affiliate.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const firstApproval = parsed.data.status === "APPROVED" && !before.approvedAt;
  const affiliate = await prisma.affiliate.update({
    where: { id },
    data: { ...parsed.data, ...(firstApproval ? { approvedAt: new Date() } : {}) },
  });
  // A rate change applies to future sales; recorded commissions keep theirs.
  if (firstApproval) {
    try {
      await sendAffiliateWelcome(affiliate);
    } catch (err) {
      return NextResponse.json({ affiliate, warning: `Approved, but the welcome email failed: ${String((err as Error)?.message || err).slice(0, 160)}` });
    }
    return NextResponse.json({ affiliate, message: `Approved — welcome email sent to ${affiliate.email}.` });
  }
  return NextResponse.json({ affiliate });
}

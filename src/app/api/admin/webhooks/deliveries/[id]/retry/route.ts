import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { deliver } from "@/lib/webhooks";

export const runtime = "nodejs";

/** Re-send a failed delivery now (same webhook-id, so receivers can de-duplicate). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const res = await prisma.webhookDelivery.updateMany({
    where: { id, status: { in: ["FAILED", "PENDING"] } },
    data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date() },
  });
  if (res.count === 0) return NextResponse.json({ error: "Nothing to retry." }, { status: 409 });
  const ok = await deliver(id);
  return NextResponse.json({ ok });
}

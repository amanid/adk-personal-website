import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { decryptWebhookSecret } from "@/lib/webhooks";

export const runtime = "nodejs";

/** Reveal an endpoint's signing secret (admin only, never cached). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const e = await prisma.webhookEndpoint.findUnique({ where: { id }, select: { secretEnc: true } });
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ secret: decryptWebhookSecret(e.secretEnc) }, { headers: { "Cache-Control": "no-store" } });
}

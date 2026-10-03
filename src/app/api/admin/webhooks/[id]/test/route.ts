import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { deliver } from "@/lib/webhooks";

export const runtime = "nodejs";

/** Send a signed "ping" to one endpoint now and report the outcome. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id } });
  if (!endpoint) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messageId = `msg_${randomUUID().replace(/-/g, "")}`;
  const d = await prisma.webhookDelivery.create({
    data: {
      endpointId: id,
      messageId,
      event: "ping",
      payload: { id: messageId, type: "ping", created_at: new Date().toISOString(), data: { message: "Test from konanamanidieudonne.org" } },
    },
  });
  const ok = await deliver(d.id);
  const after = await prisma.webhookDelivery.findUnique({ where: { id: d.id }, select: { lastStatusCode: true, lastError: true } });
  // A test that failed shouldn't keep retrying in the background.
  if (!ok) await prisma.webhookDelivery.update({ where: { id: d.id }, data: { status: "FAILED" } });
  return NextResponse.json({ ok, statusCode: after?.lastStatusCode ?? null, error: after?.lastError ?? null });
}

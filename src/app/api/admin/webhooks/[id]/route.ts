import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { WEBHOOK_EVENTS, validateWebhookUrl } from "@/lib/webhooks";

const updateSchema = z.object({
  url: z.string().max(500).optional(),
  description: z.string().max(200).optional().or(z.literal("")),
  events: z.array(z.string()).max(20).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;
  if (d.url !== undefined) {
    const err = validateWebhookUrl(d.url);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }
  const endpoint = await prisma.webhookEndpoint
    .update({
      where: { id },
      data: {
        ...(d.url !== undefined ? { url: d.url } : {}),
        ...(d.description !== undefined ? { description: d.description || null } : {}),
        ...(d.events !== undefined ? { events: d.events.filter((e) => e in WEBHOOK_EVENTS) } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
      },
      select: { id: true, url: true, description: true, events: true, active: true },
    })
    .catch(() => null);
  if (!endpoint) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ endpoint });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.webhookEndpoint.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

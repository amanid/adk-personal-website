import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { WEBHOOK_EVENTS, encryptWebhookSecret, generateWebhookSecret, validateWebhookUrl } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  url: z.string().max(500),
  description: z.string().max(200).optional().or(z.literal("")),
  events: z.array(z.string()).max(20),
});

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [endpoints, deliveries] = await Promise.all([
    prisma.webhookEndpoint.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, description: true, events: true, active: true, createdAt: true },
    }),
    prisma.webhookDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, endpointId: true, event: true, status: true, attempts: true, lastStatusCode: true,
        lastError: true, nextAttemptAt: true, deliveredAt: true, createdAt: true,
      },
    }),
  ]);
  return NextResponse.json({ endpoints, deliveries, events: WEBHOOK_EVENTS });
}

/** Create an endpoint. The signing secret is returned once, here. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const urlError = validateWebhookUrl(parsed.data.url);
  if (urlError) return NextResponse.json({ error: urlError }, { status: 400 });
  const events = parsed.data.events.filter((e) => e in WEBHOOK_EVENTS);
  const secret = generateWebhookSecret();
  const endpoint = await prisma.webhookEndpoint.create({
    data: { url: parsed.data.url, description: parsed.data.description || null, events, secretEnc: encryptWebhookSecret(secret) },
    select: { id: true, url: true, description: true, events: true, active: true },
  });
  return NextResponse.json({ endpoint, secret }, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { API_SETTING_KEYS, currentPeriod, effectivePlan, getApiSettings } from "@/lib/data-api";
import { setupApiProPlan } from "@/lib/data-api-billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const period = currentPeriod();
  const [settings, keys, usage] = await Promise.all([
    getApiSettings(),
    prisma.apiKey.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.apiUsage.findMany({ where: { period } }),
  ]);
  const used = new Map(usage.map((u) => [u.keyId, u.count]));
  return NextResponse.json({
    settings,
    period,
    paypalConfigured: !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET,
    keys: keys.map((k) => ({
      id: k.id, name: k.name, email: k.email, useCase: k.useCase, keyPrefix: k.keyPrefix, status: k.status,
      plan: effectivePlan(k), paid: !!k.paypalSubscriptionId, currentPeriodEnd: k.currentPeriodEnd,
      lastUsedAt: k.lastUsedAt, createdAt: k.createdAt, usedThisMonth: used.get(k.id) ?? 0,
    })),
  });
}

const settingsSchema = z.object({
  freeQuota: z.number().int().min(1).max(10_000_000),
  proQuota: z.number().int().min(1).max(100_000_000),
});

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const values = { [API_SETTING_KEYS.freeQuota]: String(parsed.data.freeQuota), [API_SETTING_KEYS.proQuota]: String(parsed.data.proQuota) };
  await prisma.$transaction(Object.entries(values).map(([key, value]) => prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })));
  return NextResponse.json({ ok: true, message: "Saved." });
}

/** Set the Pro monthly price: creates the PayPal plan new subscribers use. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const priceCents = Number(body?.priceCents);
  if (!Number.isInteger(priceCents) || priceCents < 100 || priceCents > 1_000_000) {
    return NextResponse.json({ error: "Enter a monthly price between $1 and $10,000." }, { status: 400 });
  }
  try {
    const planId = await setupApiProPlan(priceCents, process.env.NEXT_PUBLIC_APP_URL || "https://www.konanamanidieudonne.org");
    return NextResponse.json({ planId, message: "Pro plan created in PayPal. Developers can now upgrade." });
  } catch (e) {
    return NextResponse.json({ error: `PayPal refused: ${String((e as Error).message).slice(0, 300)}` }, { status: 502 });
  }
}

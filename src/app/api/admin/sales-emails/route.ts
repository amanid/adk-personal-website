import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { getSalesSettings, runSalesAutomation, SALES_SETTING_KEYS } from "@/lib/sales-emails";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [settings, last, optOuts] = await Promise.all([
    getSalesSettings(),
    prisma.siteSetting.findUnique({ where: { key: SALES_SETTING_KEYS.lastRun } }),
    prisma.emailOptOut.count(),
  ]);
  return NextResponse.json({
    settings,
    lastRun: last ? JSON.parse(last.value) : null,
    optOuts,
    cronConfigured: !!process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 16,
  });
}

const settingsSchema = z.object({
  remindersEnabled: z.boolean(),
  reminderHours: z.number().int().min(1).max(168),
  followUpsEnabled: z.boolean(),
  followUpDays: z.number().int().min(1).max(60),
});

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const values = {
    [SALES_SETTING_KEYS.remindersEnabled]: String(d.remindersEnabled),
    [SALES_SETTING_KEYS.reminderHours]: String(d.reminderHours),
    [SALES_SETTING_KEYS.followUpsEnabled]: String(d.followUpsEnabled),
    [SALES_SETTING_KEYS.followUpDays]: String(d.followUpDays),
  };
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) => prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } }))
  );
  return NextResponse.json({ ok: true, message: "Saved." });
}

/** "Run now" from the admin. */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const r = await runSalesAutomation();
  return NextResponse.json({ ...r, message: `Sent ${r.reminders} reminder(s) and ${r.followUps} follow-up(s).` });
}

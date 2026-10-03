import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { affiliateSettingsSchema } from "@/lib/validations";
import { AFFILIATE_SETTING_KEYS } from "@/lib/affiliates";

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = affiliateSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const values = {
    [AFFILIATE_SETTING_KEYS.defaultPercent]: String(parsed.data.defaultPercent),
    [AFFILIATE_SETTING_KEYS.cookieDays]: String(parsed.data.cookieDays),
    [AFFILIATE_SETTING_KEYS.holdDays]: String(parsed.data.holdDays),
  };
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
  return NextResponse.json({ ok: true, message: "Saved. The default rate applies to new affiliates." });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { availabilitySchema } from "@/lib/validations";
import { BOOKING_SETTING_KEYS } from "@/lib/booking";
import { isValidTimeZone } from "@/lib/timezone";

/** Replace the weekly hours and the booking settings in one transaction. */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = availabilitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { rules, settings } = parsed.data;
  if (!isValidTimeZone(settings.timeZone)) {
    return NextResponse.json({ error: "Unknown time zone" }, { status: 400 });
  }
  const values: Record<string, string> = {
    [BOOKING_SETTING_KEYS.timeZone]: settings.timeZone,
    [BOOKING_SETTING_KEYS.minNoticeHours]: String(settings.minNoticeHours),
    [BOOKING_SETTING_KEYS.windowDays]: String(settings.windowDays),
    [BOOKING_SETTING_KEYS.bufferMinutes]: String(settings.bufferMinutes),
    [BOOKING_SETTING_KEYS.slotStepMinutes]: String(settings.slotStepMinutes),
    [BOOKING_SETTING_KEYS.manualHoldHours]: String(settings.manualHoldHours),
    [BOOKING_SETTING_KEYS.meetingUrl]: settings.meetingUrl || "",
  };
  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({}),
    prisma.availabilityRule.createMany({ data: rules }),
    ...Object.entries(values).map(([key, value]) =>
      prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
    ),
  ]);
  return NextResponse.json({ ok: true });
}

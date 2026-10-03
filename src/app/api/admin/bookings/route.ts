import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { getBookingSettings } from "@/lib/booking";

export const dynamic = "force-dynamic";

/** Everything the bookings admin needs in one round trip. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [bookings, packages, rules, blocked, settings] = await Promise.all([
    prisma.booking.findMany({
      where: { OR: [{ startsAt: { gte: since } }, { status: "RESCHEDULE_NEEDED" }] },
      orderBy: { startsAt: "asc" },
      take: 300,
      include: {
        package: { select: { title: true, durationMinutes: true } },
        order: { select: { id: true, orderNumber: true, status: true, paymentMethod: true, totalCents: true, currency: true } },
      },
    }),
    prisma.servicePackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.availabilityRule.findMany({ orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] }),
    prisma.blockedPeriod.findMany({ where: { endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } }),
    getBookingSettings(),
  ]);
  return NextResponse.json({ bookings, packages, rules, blocked, settings });
}

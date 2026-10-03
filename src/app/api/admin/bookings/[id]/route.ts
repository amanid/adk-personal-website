import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { adminBookingUpdateSchema } from "@/lib/validations";
import { sendBookingConfirmation } from "@/lib/booking-notify";

export const runtime = "nodejs";

/**
 * Admin changes to a booking: complete, cancel, set the meeting link, or move
 * it to a new time (which re-confirms it and re-sends the invite). A move is
 * the admin's decision, so it may fall outside the published hours, but it may
 * never overlap another live booking.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const parsed = adminBookingUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const input = parsed.data;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { package: true, order: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Confirming by hand only makes sense once it has been paid (or is free).
  if (input.status === "CONFIRMED" && booking.order && booking.order.status !== "PAID") {
    return NextResponse.json({ error: "Confirm the payment on the order first." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (input.meetingUrl !== undefined) data.meetingUrl = input.meetingUrl || null;
  if (input.status) {
    data.status = input.status;
    if (input.status === "CANCELLED") data.cancelledAt = new Date();
  }

  let resend = false;
  if (input.startsAt) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(startsAt.getTime() + booking.package.durationMinutes * 60_000);
    const clash = await prisma.booking.count({
      where: {
        id: { not: id },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        OR: [
          { status: { in: ["CONFIRMED", "RESCHEDULE_NEEDED", "COMPLETED"] } },
          { status: "PENDING_PAYMENT", holdExpiresAt: { gt: new Date() } },
        ],
      },
    });
    if (clash > 0) return NextResponse.json({ error: "That time overlaps another booking." }, { status: 409 });
    Object.assign(data, { startsAt, endsAt, status: input.status ?? "CONFIRMED", holdExpiresAt: null });
    resend = true;
  }

  const updated = await prisma.booking.update({ where: { id }, data, include: { package: true } });

  if (resend || (input.status === "CONFIRMED" && booking.status !== "CONFIRMED")) {
    try {
      await sendBookingConfirmation(updated);
    } catch (err) {
      return NextResponse.json({ booking: updated, warning: `Saved, but the email failed: ${String((err as Error)?.message || err).slice(0, 200)}` });
    }
  }
  return NextResponse.json({ booking: updated });
}

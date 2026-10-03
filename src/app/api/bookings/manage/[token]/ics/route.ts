import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingIcs } from "@/lib/booking-notify";

export const dynamic = "force-dynamic";

/** Calendar file for a confirmed booking; the token is the client's bearer link. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length > 100) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const booking = await prisma.booking.findUnique({ where: { manageToken: token }, include: { package: true } });
  if (!booking || booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(bookingIcs(booking, null), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="session.ics"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

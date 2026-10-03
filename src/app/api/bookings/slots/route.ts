import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { availableSlots, getBookingSettings } from "@/lib/booking";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Free start times (ISO, UTC) for a package across the booking window. */
export async function GET(request: Request) {
  const limited = rateLimit(request, { limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const slug = new URL(request.url).searchParams.get("package") || "";
  const pkg = await prisma.servicePackage.findFirst({
    where: { slug, active: true },
    select: { id: true },
  });
  if (!pkg) return NextResponse.json({ error: "Unknown package" }, { status: 404 });

  const [slots, settings] = await Promise.all([availableSlots(pkg.id), getBookingSettings()]);
  return NextResponse.json(
    { timeZone: settings.timeZone, slots },
    { headers: { "Cache-Control": "no-store" } }
  );
}

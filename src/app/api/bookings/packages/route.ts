import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Active consulting packages, for the booking page. */
export async function GET() {
  const packages = await prisma.servicePackage.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
    select: {
      slug: true,
      title: true,
      titleFr: true,
      description: true,
      descriptionFr: true,
      durationMinutes: true,
      priceCents: true,
      currency: true,
    },
  });
  return NextResponse.json({ packages });
}

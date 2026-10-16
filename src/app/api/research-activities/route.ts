import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectFiles } from "@/lib/publication-access";

export async function GET() {
  try {
    // Public listing: published rows only, and gated file URLs swapped for the
    // access-checked route so the raw upload ids never reach the browser.
    const rows = await prisma.researchActivity.findMany({
      where: { published: true },
      orderBy: { date: "desc" },
    });
    const activities = rows.map((a) => {
      const p = protectFiles({ ...a, slug: `research-activity-${a.id}` });
      return { ...p, slug: undefined };
    });
    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Research activities fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

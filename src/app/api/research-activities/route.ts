import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activities = await prisma.researchActivity.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Research activities fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

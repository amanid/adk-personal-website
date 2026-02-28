import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settingsArr = await prisma.siteSetting.findMany();
    const settings: Record<string, string> = {};
    for (const s of settingsArr) {
      settings[s.key] = s.value;
    }
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

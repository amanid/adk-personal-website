import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const certifications = await prisma.certification.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ certifications });
  } catch (error) {
    console.error("Certifications fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publications = await prisma.publication.findMany({
      orderBy: { views: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        views: true,
        category: true,
      },
    });

    return NextResponse.json({ publications });
  } catch (error) {
    console.error("Top publications fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const validStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];

    const orders = await prisma.order.findMany({
      where: status && validStatuses.includes(status) ? { status: status as never } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        items: true,
        _count: { select: { downloads: true } },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

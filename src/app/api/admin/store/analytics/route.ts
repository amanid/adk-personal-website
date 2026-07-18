import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      paidAgg,
      paidCount,
      pendingCount,
      failedCount,
      refundedCount,
      paidItems,
      revenueByDayRaw,
      downloadsAgg,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalCents: true },
      }),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.order.count({ where: { status: "REFUNDED" } }),
      prisma.orderItem.findMany({
        where: { order: { status: "PAID" } },
        select: { bookId: true, titleSnapshot: true, quantity: true, unitPriceCents: true },
      }),
      prisma.$queryRawUnsafe<Array<{ date: string; cents: bigint }>>(
        `SELECT DATE("paidAt") as date, SUM("totalCents")::bigint as cents
         FROM "Order"
         WHERE status = 'PAID' AND "paidAt" >= $1
         GROUP BY DATE("paidAt")
         ORDER BY date ASC`,
        startDate
      ),
      prisma.downloadGrant.aggregate({ _sum: { downloadCount: true } }),
    ]);

    // Top books by units sold (and revenue) from paid items.
    const byBook = new Map<string, { title: string; units: number; revenueCents: number }>();
    let unitsSold = 0;
    for (const it of paidItems) {
      unitsSold += it.quantity;
      const prev = byBook.get(it.bookId) || {
        title: it.titleSnapshot,
        units: 0,
        revenueCents: 0,
      };
      prev.units += it.quantity;
      prev.revenueCents += it.unitPriceCents * it.quantity;
      byBook.set(it.bookId, prev);
    }

    const topBooksByUnits = [...byBook.values()]
      .sort((a, b) => b.units - a.units)
      .slice(0, 10)
      .map((b) => ({ name: b.title, value: b.units }));

    const topBooksByRevenue = [...byBook.values()]
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 10)
      .map((b) => ({ name: b.title, value: Math.round(b.revenueCents / 100) }));

    const revenueByDay = revenueByDayRaw.map((r) => ({
      date: r.date,
      revenueCents: Number(r.cents),
    }));

    const totalRevenueCents = paidAgg._sum.totalCents || 0;

    return NextResponse.json({
      summary: {
        totalRevenueCents,
        paidOrders: paidCount,
        unitsSold,
        totalDownloads: downloadsAgg._sum.downloadCount || 0,
        avgOrderValueCents: paidCount > 0 ? Math.round(totalRevenueCents / paidCount) : 0,
      },
      ordersByStatus: [
        { name: "Paid", value: paidCount },
        { name: "Pending", value: pendingCount },
        { name: "Failed", value: failedCount },
        { name: "Refunded", value: refundedCount },
      ].filter((s) => s.value > 0),
      revenueByDay,
      topBooksByUnits,
      topBooksByRevenue,
    });
  } catch (error) {
    console.error("Store analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

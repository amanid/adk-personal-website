import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { minorToMajor } from "@/lib/currency";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      revenueGroups,
      paidCount,
      pendingCount,
      failedCount,
      refundedCount,
      paidItems,
      downloadsAgg,
    ] = await Promise.all([
      prisma.order.groupBy({
        by: ["currency"],
        where: { status: "PAID" },
        _sum: { totalCents: true },
        _count: { _all: true },
      }),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.order.count({ where: { status: "REFUNDED" } }),
      prisma.orderItem.findMany({
        where: { order: { status: "PAID" } },
        select: {
          bookId: true,
          titleSnapshot: true,
          quantity: true,
          unitPriceCents: true,
          order: { select: { currency: true } },
        },
      }),
      prisma.downloadGrant.aggregate({ _sum: { downloadCount: true } }),
    ]);

    // Revenue grouped by currency (never summed across currencies).
    const revenueByCurrency = revenueGroups
      .map((g) => {
        const cents = g._sum.totalCents || 0;
        const orders = g._count._all;
        return {
          currency: g.currency,
          cents,
          orders,
          avgCents: orders > 0 ? Math.round(cents / orders) : 0,
        };
      })
      .sort((a, b) => b.cents - a.cents);

    const primaryCurrency = revenueByCurrency[0]?.currency || "USD";

    // Units + per-book revenue (each book carries its order's currency).
    const byBook = new Map<
      string,
      { title: string; units: number; cents: number; currency: string }
    >();
    let unitsSold = 0;
    for (const it of paidItems) {
      unitsSold += it.quantity;
      const cur = it.order.currency;
      const prev = byBook.get(it.bookId) || {
        title: it.titleSnapshot,
        units: 0,
        cents: 0,
        currency: cur,
      };
      prev.units += it.quantity;
      prev.cents += it.unitPriceCents * it.quantity;
      byBook.set(it.bookId, prev);
    }

    const topBooksByUnits = [...byBook.values()]
      .sort((a, b) => b.units - a.units)
      .slice(0, 10)
      .map((b) => ({ name: b.title, value: b.units }));

    // Revenue bar chart is single-currency (the primary one) so the axis is meaningful.
    const topBooksByRevenue = [...byBook.values()]
      .filter((b) => b.currency === primaryCurrency)
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 10)
      .map((b) => ({ name: b.title, value: Math.round(minorToMajor(b.cents, b.currency)) }));

    // Daily revenue for the primary currency only.
    const revenueByDayRaw = await prisma.$queryRawUnsafe<Array<{ date: string; cents: bigint }>>(
      `SELECT DATE("paidAt") as date, SUM("totalCents")::bigint as cents
       FROM "Order"
       WHERE status = 'PAID' AND "currency" = $2 AND "paidAt" >= $1
       GROUP BY DATE("paidAt")
       ORDER BY date ASC`,
      startDate,
      primaryCurrency
    );
    const revenueByDay = revenueByDayRaw.map((r) => ({
      date: r.date,
      views: Math.round(minorToMajor(Number(r.cents), primaryCurrency)),
    }));

    return NextResponse.json({
      revenueByCurrency,
      primaryCurrency,
      summary: {
        paidOrders: paidCount,
        unitsSold,
        totalDownloads: downloadsAgg._sum.downloadCount || 0,
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

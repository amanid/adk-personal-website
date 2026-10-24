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
        // Book lines only; bookings and quote payments have no book.
        where: { order: { status: "PAID" }, bookId: { not: null } },
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
      if (!it.bookId) continue;
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

    // House ads: impressions, clicks and the paid orders they led to, by placement.
    const [promoEvents, promoOrders] = await Promise.all([
      prisma.promoEvent.groupBy({
        by: ["placement", "event"],
        where: { createdAt: { gte: startDate } },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: { status: "PAID", source: { startsWith: "promo:" }, paidAt: { gte: startDate } },
        select: { source: true, totalCents: true, currency: true },
      }),
    ]);
    const byPlacement = new Map<string, { placement: string; impressions: number; clicks: number; orders: number; revenueCents: number }>();
    const slot = (placement: string) => {
      if (!byPlacement.has(placement)) byPlacement.set(placement, { placement, impressions: 0, clicks: 0, orders: 0, revenueCents: 0 });
      return byPlacement.get(placement)!;
    };
    for (const e of promoEvents) {
      const row = slot(e.placement);
      if (e.event === "impression") row.impressions += e._count._all;
      else if (e.event === "click") row.clicks += e._count._all;
    }
    for (const o of promoOrders) {
      const placement = o.source?.split(":")[1] || "unknown";
      const row = slot(placement);
      row.orders += 1;
      if (o.currency === primaryCurrency) row.revenueCents += o.totalCents;
    }
    const promoRows = [...byPlacement.values()].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    const promos = {
      impressions: promoRows.reduce((n, r) => n + r.impressions, 0),
      clicks: promoRows.reduce((n, r) => n + r.clicks, 0),
      orders: promoRows.reduce((n, r) => n + r.orders, 0),
      revenue: Math.round(minorToMajor(promoRows.reduce((n, r) => n + r.revenueCents, 0), primaryCurrency)),
      byPlacement: promoRows.map((r) => ({
        ...r,
        ctr: r.impressions ? Math.round((r.clicks / r.impressions) * 1000) / 10 : 0,
        revenue: Math.round(minorToMajor(r.revenueCents, primaryCurrency)),
      })),
    };

    return NextResponse.json({
      promos,
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

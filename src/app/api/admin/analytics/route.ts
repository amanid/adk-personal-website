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
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [
      totalViews,
      prevTotalViews,
      uniquePages,
      viewsByDay,
      topPages,
      countries,
      devices,
      browsers,
      referrers,
      recentViews,
    ] = await Promise.all([
      prisma.pageView.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.pageView.count({
        where: { createdAt: { gte: prevStartDate, lt: startDate } },
      }),
      prisma.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: startDate } },
      }).then((r) => r.length),
      prisma.$queryRawUnsafe<Array<{ date: string; views: bigint }>>(
        `SELECT DATE("createdAt") as date, COUNT(*)::bigint as views
         FROM "PageView"
         WHERE "createdAt" >= $1
         GROUP BY DATE("createdAt")
         ORDER BY date ASC`,
        startDate
      ),
      prisma.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: startDate } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      prisma.pageView.groupBy({
        by: ["country"],
        where: { createdAt: { gte: startDate }, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
      prisma.pageView.groupBy({
        by: ["device"],
        where: { createdAt: { gte: startDate }, device: { not: null } },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
      prisma.pageView.groupBy({
        by: ["browser"],
        where: { createdAt: { gte: startDate }, browser: { not: null } },
        _count: { browser: true },
        orderBy: { _count: { browser: "desc" } },
      }),
      prisma.pageView.groupBy({
        by: ["referrer"],
        where: {
          createdAt: { gte: startDate },
          referrer: { not: null },
          NOT: { referrer: "" },
        },
        _count: { referrer: true },
        orderBy: { _count: { referrer: "desc" } },
        take: 10,
      }),
      prisma.pageView.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          path: true,
          country: true,
          device: true,
          browser: true,
          createdAt: true,
        },
      }),
    ]);

    const viewsTrend =
      prevTotalViews > 0
        ? Math.round(((totalViews - prevTotalViews) / prevTotalViews) * 100)
        : totalViews > 0
        ? 100
        : 0;

    return NextResponse.json({
      summary: { totalViews, uniquePages, viewsTrend },
      viewsByDay: viewsByDay.map((d) => ({
        date: d.date,
        views: Number(d.views),
      })),
      topPages: topPages.map((p) => ({
        path: p.path,
        views: p._count.path,
      })),
      countries: countries.map((c) => ({
        country: c.country,
        views: c._count.country,
      })),
      devices: devices.map((d) => ({
        device: d.device,
        views: d._count.device,
      })),
      browsers: browsers.map((b) => ({
        browser: b.browser,
        views: b._count.browser,
      })),
      referrers: referrers.map((r) => ({
        referrer: r.referrer,
        views: r._count.referrer,
      })),
      recentViews,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

/**
 * Paginated list of individual site visits (page views) with full detail, plus
 * summary counts. Admin-only. Supports filters: days, device, country, and a
 * path search.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const days = Math.min(365, Math.max(1, parseInt(sp.get("days") || "30")));
    const page = Math.max(1, parseInt(sp.get("page") || "1"));
    const limit = Math.min(200, Math.max(10, parseInt(sp.get("limit") || "50")));
    const device = sp.get("device");
    const country = sp.get("country");
    const q = sp.get("q")?.trim();

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: Prisma.PageViewWhereInput = { createdAt: { gte: startDate } };
    if (device) where.device = device;
    if (country) where.country = country;
    if (q) where.path = { contains: q, mode: "insensitive" };

    const [visits, total, uniqueVisitorRows, uniquePathRows, deviceFacets, countryFacets] =
      await Promise.all([
        prisma.pageView.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            path: true,
            referrer: true,
            country: true,
            city: true,
            device: true,
            browser: true,
            os: true,
            sessionId: true,
            createdAt: true,
          },
        }),
        prisma.pageView.count({ where }),
        prisma.pageView.findMany({
          where: { ...where, sessionId: { not: null } },
          distinct: ["sessionId"],
          select: { sessionId: true },
        }),
        prisma.pageView.findMany({
          where,
          distinct: ["path"],
          select: { path: true },
        }),
        prisma.pageView.groupBy({
          by: ["device"],
          where: { createdAt: { gte: startDate }, device: { not: null } },
          _count: { device: true },
          orderBy: { _count: { device: "desc" } },
        }),
        prisma.pageView.groupBy({
          by: ["country"],
          where: { createdAt: { gte: startDate }, country: { not: null } },
          _count: { country: true },
          orderBy: { _count: { country: "desc" } },
          take: 30,
        }),
      ]);

    return NextResponse.json({
      visits,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        totalVisits: total,
        uniqueVisitors: uniqueVisitorRows.length,
        uniquePaths: uniquePathRows.length,
      },
      facets: {
        devices: deviceFacets.map((d) => ({ value: d.device, count: d._count.device })),
        countries: countryFacets.map((c) => ({ value: c.country, count: c._count.country })),
      },
    });
  } catch (error) {
    console.error("Admin visitors fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

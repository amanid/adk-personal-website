import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { getAffiliateSettings } from "@/lib/affiliates";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [affiliates, clicks, sales, commissions, settings] = await Promise.all([
    prisma.affiliate.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    prisma.affiliateClick.groupBy({ by: ["affiliateId"], where: { createdAt: { gte: since } }, _count: true }),
    prisma.order.groupBy({ by: ["affiliateId"], where: { status: "PAID", affiliateId: { not: null } }, _count: true }),
    prisma.affiliateCommission.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { affiliate: { select: { name: true, payoutMethod: true, payoutDetails: true } }, order: { select: { orderNumber: true, totalCents: true } } },
    }),
    getAffiliateSettings(),
  ]);
  const clicksBy = new Map(clicks.map((c) => [c.affiliateId, c._count]));
  const salesBy = new Map(sales.map((s) => [s.affiliateId, s._count]));
  return NextResponse.json({
    affiliates: affiliates.map((a) => ({ ...a, clicks30: clicksBy.get(a.id) ?? 0, paidSales: salesBy.get(a.id) ?? 0 })),
    commissions,
    settings,
  });
}

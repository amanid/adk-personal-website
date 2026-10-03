import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { listClosedTrades, oandaConfig } from "@/lib/oanda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const cfg = oandaConfig();
  const [closed, audit] = await Promise.all([
    cfg ? listClosedTrades(cfg, 100).catch(() => []) : [],
    prisma.tradeAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, environment: true, action: true, instrument: true, units: true, ok: true, error: true, createdAt: true } }),
  ]);
  return NextResponse.json({ closed, audit });
}

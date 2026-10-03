import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { getPlanMap, setupPayPalPlans } from "@/lib/paypal-subscriptions";
import { TIER_PRICES } from "@/lib/subscription-plans";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [plans, subscriptions] = await Promise.all([
    getPlanMap(),
    prisma.subscription.findMany({
      orderBy: { updatedAt: "desc" },
      take: 300,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);
  return NextResponse.json({
    plans,
    prices: TIER_PRICES,
    paypalConfigured: !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET,
    paypalEnv: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    subscriptions,
  });
}

/** Create the PayPal product and plans at the current prices. */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const plans = await setupPayPalPlans(process.env.NEXT_PUBLIC_APP_URL || "https://www.konanamanidieudonne.org");
    return NextResponse.json({ plans, message: "PayPal plans created. Subscribers can now pay automatically." });
  } catch (error) {
    console.error("PayPal plan setup error:", error);
    return NextResponse.json({ error: `PayPal refused: ${String((error as Error)?.message || error).slice(0, 300)}` }, { status: 502 });
  }
}

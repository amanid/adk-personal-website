import { NextResponse } from "next/server";
import { getPlanMap } from "@/lib/paypal-subscriptions";

export const dynamic = "force-dynamic";

/** Plan ids for the subscribe buttons (public by design), or null if not set up. */
export async function GET() {
  const plans = await getPlanMap().catch(() => null);
  return NextResponse.json({ plans: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? plans : null });
}

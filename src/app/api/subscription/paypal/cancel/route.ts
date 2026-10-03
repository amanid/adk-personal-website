import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { cancelUserPayPalSubscription } from "@/lib/paypal-subscriptions";

export const runtime = "nodejs";

/** Stop renewal. Access continues until the end of the paid period. */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 5, windowSeconds: 60 });
  if (limited) return limited;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    const done = await cancelUserPayPalSubscription(userId);
    if (!done) return NextResponse.json({ error: "No active PayPal subscription." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Subscription cancel error:", error);
    return NextResponse.json({ error: "Could not cancel with PayPal. Please try again." }, { status: 502 });
  }
}

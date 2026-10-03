import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { cancelBillingSubscription } from "@/lib/paypal";
import { syncPayPalSubscription } from "@/lib/paypal-subscriptions";

export const runtime = "nodejs";

/**
 * Called after the subscriber approves in PayPal. The id from the browser is
 * only a pointer: the subscription is fetched from PayPal and must be on one
 * of our plans and carry this user's id before access is granted.
 */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId : "";
  if (!/^I-[A-Z0-9]{6,40}$/.test(subscriptionId)) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  try {
    const before = await prisma.subscription.findUnique({ where: { userId } });
    const result = await syncPayPalSubscription(subscriptionId, userId);
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

    // Replacing an existing PayPal subscription: stop billing the old one.
    if (before?.paypalSubscriptionId && before.paypalSubscriptionId !== subscriptionId && before.status === "ACTIVE") {
      await cancelBillingSubscription(before.paypalSubscriptionId, "Replaced by a new subscription").catch((e) =>
        console.error("Could not cancel the replaced subscription:", e)
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Subscription activation error:", error);
    return NextResponse.json({ error: "Could not verify the subscription with PayPal." }, { status: 502 });
  }
}

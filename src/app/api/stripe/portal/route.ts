import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkOrigin } from "@/lib/origin-check";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    // State-changing and cookie-authenticated: refuse cross-site callers.
    const originBlocked = checkOrigin(request);
    if (originBlocked) return originBlocked;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Redirect targets come from config, never from the request's Origin header.
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/subscribe`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch {
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

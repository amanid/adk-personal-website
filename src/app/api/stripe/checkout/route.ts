import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, SUBSCRIPTION_PRICES } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 5, windowSeconds: 60 });
    if (limited) return limited;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier, billing } = await request.json();

    if (!["DOCUMENT_ACCESS", "DATA_ACCESS", "FULL_ACCESS"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    if (!["monthly", "yearly"].includes(billing)) {
      return NextResponse.json({ error: "Invalid billing" }, { status: 400 });
    }

    const priceId =
      SUBSCRIPTION_PRICES[tier as keyof typeof SUBSCRIPTION_PRICES][
        billing as "monthly" | "yearly"
      ];

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe prices not configured" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });

    let customerId = existingSub?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/subscribe?success=true`,
      cancel_url: `${origin}/subscribe?cancelled=true`,
      metadata: { userId, tier },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

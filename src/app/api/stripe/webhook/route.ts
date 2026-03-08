import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;
        if (!userId || !tier) break;

        const subscriptionId = session.subscription as string;
        const stripeSubscription =
          await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
            items: { data: { price: { id: string } }[] };
            current_period_start: number;
            current_period_end: number;
          };

        const periodStart = new Date(stripeSubscription.current_period_start * 1000);
        const periodEnd = new Date(stripeSubscription.current_period_end * 1000);
        const priceId = stripeSubscription.items.data[0]?.price.id;

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            tier: tier as "DOCUMENT_ACCESS" | "DATA_ACCESS" | "FULL_ACCESS",
            status: "ACTIVE",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
          update: {
            tier: tier as "DOCUMENT_ACCESS" | "DATA_ACCESS" | "FULL_ACCESS",
            status: "ACTIVE",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as unknown as {
          id: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
          cancel_at_period_end: boolean;
        };
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!existing) break;

        const statusMap: Record<string, string> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELLED",
          unpaid: "PAST_DUE",
          trialing: "TRIALING",
        };

        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: (statusMap[sub.status] || "ACTIVE") as
              | "ACTIVE"
              | "CANCELLED"
              | "PAST_DUE"
              | "EXPIRED"
              | "TRIALING",
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as unknown as { id: string };
        await prisma.subscription
          .update({
            where: { stripeSubscriptionId: deletedSub.id },
            data: { status: "CANCELLED" },
          })
          .catch(() => {});
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { subscription: string | null };
        const subId = invoice.subscription;
        if (subId) {
          await prisma.subscription
            .update({
              where: { stripeSubscriptionId: subId },
              data: { status: "PAST_DUE" },
            })
            .catch(() => {});
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

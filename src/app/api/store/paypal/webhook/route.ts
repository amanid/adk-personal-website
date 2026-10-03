import { NextRequest, NextResponse } from "next/server";
import { syncPayPalSubscription } from "@/lib/paypal-subscriptions";
import { prisma } from "@/lib/prisma";
import { verifyPayPalWebhook, moneyToCents } from "@/lib/paypal";
import { fulfilPaidOrder, voidUnpaidOrder, revokeRefundedOrder } from "@/lib/order-fulfillment";

export const runtime = "nodejs";

interface PayPalWebhookEvent {
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    status?: string;
    amount?: { value: string; currency_code: string };
  };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Parse before verifying, but inside a try: a malformed body used to throw
  // here, outside any handler, and surface as an unhandled 500.
  let parsed: unknown = null;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const verified = await verifyPayPalWebhook({
    authAlgo: request.headers.get("paypal-auth-algo"),
    certUrl: request.headers.get("paypal-cert-url"),
    transmissionId: request.headers.get("paypal-transmission-id"),
    transmissionSig: request.headers.get("paypal-transmission-sig"),
    transmissionTime: request.headers.get("paypal-transmission-time"),
    event: parsed,
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const orderId = event.resource?.custom_id;

    // Research subscriptions: re-read the subscription from PayPal and sync.
    const subEvents = [
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "BILLING.SUBSCRIPTION.UPDATED",
      "BILLING.SUBSCRIPTION.CANCELLED",
      "BILLING.SUBSCRIPTION.SUSPENDED",
      "BILLING.SUBSCRIPTION.EXPIRED",
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
    ];
    if (event.event_type && subEvents.includes(event.event_type)) {
      const id = (event.resource as { id?: string } | undefined)?.id;
      if (id) await syncPayPalSubscription(id);
      return NextResponse.json({ received: true });
    }
    if (event.event_type === "PAYMENT.SALE.COMPLETED") {
      // A recurring payment: its subscription id is the billing agreement.
      const id = (event.resource as { billing_agreement_id?: string } | undefined)?.billing_agreement_id;
      if (id) await syncPayPalSubscription(id);
      return NextResponse.json({ received: true });
    }

    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        if (!orderId) break;
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.status === "PAID") break;

        // Verify amount before honoring the webhook.
        const amt = event.resource?.amount;
        if (
          amt &&
          moneyToCents(amt.value) === order.totalCents &&
          amt.currency_code === order.currency
        ) {
          await fulfilPaidOrder(order.id, { paypalCaptureId: event.resource?.id });
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED": {
        if (!orderId) break;
        await voidUnpaidOrder(orderId, "FAILED").catch(() => {});
        break;
      }

      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        if (!orderId) break;
        // Revoke downloads and cancel any booking the payment was for.
        await revokeRefundedOrder(orderId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook handler error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

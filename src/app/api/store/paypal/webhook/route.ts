import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayPalWebhook, moneyToCents } from "@/lib/paypal";
import { fulfilPaidOrder } from "@/lib/order-fulfillment";

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

  const verified = await verifyPayPalWebhook({
    authAlgo: request.headers.get("paypal-auth-algo"),
    certUrl: request.headers.get("paypal-cert-url"),
    transmissionId: request.headers.get("paypal-transmission-id"),
    transmissionSig: request.headers.get("paypal-transmission-sig"),
    transmissionTime: request.headers.get("paypal-transmission-time"),
    event: rawBody ? JSON.parse(rawBody) : null,
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
        await prisma.order
          .updateMany({
            where: { id: orderId, status: { not: "PAID" } },
            data: { status: "FAILED" },
          })
          .catch(() => {});
        break;
      }

      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        if (!orderId) break;
        await prisma.order
          .update({ where: { id: orderId }, data: { status: "REFUNDED" } })
          .catch(() => {});
        // Revoke downloads on refund.
        await prisma.downloadGrant
          .updateMany({ where: { orderId }, data: { expiresAt: new Date(0) } })
          .catch(() => {});
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook handler error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

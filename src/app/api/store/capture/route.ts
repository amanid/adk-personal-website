import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder } from "@/lib/paypal";
import { fulfilPaidOrder } from "@/lib/order-fulfillment";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

export const runtime = "nodejs";

function localeFromReferer(request: Request): "en" | "fr" {
  const referer = request.headers.get("referer") || "";
  return referer.includes("/fr/") || referer.endsWith("/fr") ? "fr" : "en";
}

export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;

  const limited = rateLimit(request, { limit: 20, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : null;
    const paypalOrderId =
      typeof body?.paypalOrderId === "string" ? body.paypalOrderId : null;
    if (!orderId || !paypalOrderId) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // The caller must prove they own this order by presenting the matching
    // PayPal order id (high-entropy, PayPal-generated). This prevents anyone
    // who merely guesses/enumerates our order id from retrieving the receipt.
    if (!order.paypalOrderId || order.paypalOrderId !== paypalOrderId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotent: already paid — return the existing receipt.
    if (order.status === "PAID") {
      return NextResponse.json({ receiptToken: order.receiptToken });
    }

    const capture = await capturePayPalOrder(order.paypalOrderId);

    // Verify the payment server-side before unlocking anything.
    const amountOk = capture.amountCents === order.totalCents;
    const currencyOk = capture.currency === order.currency;
    if (capture.status !== "COMPLETED" || !amountOk || !currencyOk) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          paypalCaptureId: capture.captureId,
        },
      });
      return NextResponse.json(
        { error: "Payment could not be verified" },
        { status: 402 }
      );
    }

    // Mark paid, create download grants, and email the receipt (shared path).
    await fulfilPaidOrder(order.id, {
      paypalCaptureId: capture.captureId,
      locale: localeFromReferer(request),
    });

    return NextResponse.json({ receiptToken: order.receiptToken });
  } catch (error) {
    console.error("Store capture error:", error);
    return NextResponse.json({ error: "Capture failed" }, { status: 500 });
  }
}

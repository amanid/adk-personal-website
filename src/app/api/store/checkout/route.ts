import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations";
import { priceOrder } from "@/lib/store";
import { createOrderRecord, startPayPalPayment } from "@/lib/orders";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;

  const limited = rateLimit(request, { limit: 15, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, items } = validation.data;
    const couponCode = typeof body?.couponCode === "string" ? body.couponCode : null;

    // Recompute prices + coupon server-side from the database — never trust the client.
    let priced;
    try {
      priced = await priceOrder(items, couponCode);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Unable to price cart" },
        { status: 400 }
      );
    }

    // A fully-discounted (free) order can't go through PayPal.
    if (priced.totalCents <= 0) {
      return NextResponse.json(
        { error: "This order is free — use the free checkout." },
        { status: 400 }
      );
    }

    const order = await createOrderRecord({
      email,
      name,
      currency: priced.currency,
      lines: priced.items.map((i) => ({
        bookId: i.bookId,
        bundleId: i.bundleId,
        title: i.title,
        unitPriceCents: i.unitPriceCents,
        quantity: i.quantity,
      })),
      subtotalCents: priced.subtotalCents,
      discountCents: priced.discountCents,
      couponId: priced.couponId,
      couponCode: priced.couponCode,
      totalCents: priced.totalCents,
      ipAddress: clientIp(request),
    });
    const { paypalOrderId } = await startPayPalPayment(order);

    return NextResponse.json({
      orderId: order.id,
      paypalOrderId,
      totalCents: priced.totalCents,
      currency: priced.currency,
    });
  } catch (error) {
    console.error("Store checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}

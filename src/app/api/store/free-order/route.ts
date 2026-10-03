import { NextResponse } from "next/server";
import { freeOrderSchema } from "@/lib/validations";
import { priceOrder } from "@/lib/store";
import { createOrderRecord, localeFromReferer } from "@/lib/orders";
import { fulfilPaidOrder, CouponExhaustedError } from "@/lib/order-fulfillment";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { resolveAffiliate } from "@/lib/affiliates";
import { checkOrigin } from "@/lib/origin-check";

export const runtime = "nodejs";

/**
 * Claim a free order. The server recomputes prices from the DB and only
 * proceeds when the total is exactly zero — so a tampered cart can never turn a
 * paid order free. Downloads are granted and emailed immediately.
 */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;

  const limited = rateLimit(request, { limit: 15, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = freeOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, items } = validation.data;
    const couponCode = typeof body?.couponCode === "string" ? body.couponCode : null;

    let priced;
    try {
      priced = await priceOrder(items, couponCode);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Unable to price cart" },
        { status: 400 }
      );
    }

    // Only genuinely-free carts (naturally or via a coupon) may use this path.
    if (priced.totalCents !== 0) {
      return NextResponse.json(
        { error: "This order requires payment." },
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
      totalCents: 0,
      paymentMethod: "FREE",
      ipAddress: clientIp(request),
      affiliateId: await resolveAffiliate(request, email),
    });

    // No payment needed — fulfil immediately (grants + confirmation email).
    await fulfilPaidOrder(order.id, { locale: localeFromReferer(request) });

    return NextResponse.json({ receiptToken: order.receiptToken });
  } catch (error) {
    if (error instanceof CouponExhaustedError) {
      return NextResponse.json({ error: "This coupon has reached its redemption limit." }, { status: 409 });
    }
    console.error("Free order error:", error);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}

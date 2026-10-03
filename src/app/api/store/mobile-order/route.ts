import { NextResponse } from "next/server";
import { manualOrderSchema } from "@/lib/validations";
import { priceOrder } from "@/lib/store";
import { createOrderRecord, notifyManualOrder, localeFromReferer } from "@/lib/orders";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

export const runtime = "nodejs";

/**
 * Create a manually-settled order.
 *
 * Covers mobile money (Wave / Djamo / Orange Money) and "PayPal to PayPal" — a
 * direct transfer to the merchant's PayPal account, which needs no REST
 * credentials and no Business account. In both cases the buyer pays the
 * merchant directly and may submit a transaction reference; the order stays
 * PENDING until an admin confirms the payment, so no download is unlocked here.
 *
 * The automatic PayPal flow lives in /api/store/checkout + /api/store/capture
 * and is used instead whenever REST credentials are configured.
 */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;

  const limited = rateLimit(request, { limit: 15, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = manualOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, provider, reference, items } = validation.data;
    const couponCode = typeof body?.couponCode === "string" ? body.couponCode : null;

    // Recompute prices + coupon server-side — client amounts are never trusted.
    let priced;
    try {
      priced = await priceOrder(items, couponCode);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Unable to price cart" },
        { status: 400 }
      );
    }

    if (priced.totalCents <= 0) {
      return NextResponse.json(
        { error: "This order is free — use the free checkout." },
        { status: 400 }
      );
    }

    const lines = priced.items.map((i) => ({
      bookId: i.bookId,
      title: i.title,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
    }));
    const order = await createOrderRecord({
      email,
      name,
      currency: priced.currency,
      lines,
      subtotalCents: priced.subtotalCents,
      discountCents: priced.discountCents,
      couponId: priced.couponId,
      couponCode: priced.couponCode,
      totalCents: priced.totalCents,
      paymentMethod: provider,
      paymentReference: reference ? sanitizeInput(reference) : null,
      ipAddress: clientIp(request),
    });

    // Invoice to the buyer + "payment awaiting confirmation" to the admin.
    notifyManualOrder(order, lines, provider, localeFromReferer(request));

    return NextResponse.json({ receiptToken: order.receiptToken });
  } catch (error) {
    console.error("Mobile order error:", error);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}

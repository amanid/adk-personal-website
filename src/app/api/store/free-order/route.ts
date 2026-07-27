import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { freeOrderSchema } from "@/lib/validations";
import { priceOrder, generateOrderNumber, secureToken } from "@/lib/store";
import { fulfilPaidOrder } from "@/lib/order-fulfillment";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

export const runtime = "nodejs";

function localeFromReferer(request: Request): "en" | "fr" {
  const referer = request.headers.get("referer") || "";
  return referer.includes("/fr/") || referer.endsWith("/fr") ? "fr" : "en";
}

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

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || null;

    let orderNumber = generateOrderNumber();
    for (let i = 0; i < 3; i++) {
      const exists = await prisma.order.findUnique({ where: { orderNumber } });
      if (!exists) break;
      orderNumber = generateOrderNumber();
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        email,
        name: name || null,
        userId: existingUser?.id ?? null,
        status: "PENDING",
        paymentMethod: "FREE",
        currency: priced.currency,
        subtotalCents: priced.subtotalCents,
        discountCents: priced.discountCents,
        couponId: priced.couponId,
        couponCode: priced.couponCode,
        totalCents: 0,
        receiptToken: secureToken(),
        ipAddress: ip,
        items: {
          create: priced.items.map((i) => ({
            bookId: i.bookId,
            titleSnapshot: i.title,
            unitPriceCents: i.unitPriceCents,
            quantity: i.quantity,
          })),
        },
      },
    });

    // No payment needed — fulfil immediately (grants + confirmation email).
    await fulfilPaidOrder(order.id, { locale: localeFromReferer(request) });

    return NextResponse.json({ receiptToken: order.receiptToken });
  } catch (error) {
    console.error("Free order error:", error);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}

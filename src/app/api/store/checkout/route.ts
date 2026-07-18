import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations";
import { priceCart, generateOrderNumber, secureToken } from "@/lib/store";
import { createPayPalOrder } from "@/lib/paypal";
import { rateLimit } from "@/lib/rate-limit";
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

    // Recompute prices server-side from the database — never trust the client.
    let priced;
    try {
      priced = await priceCart(items);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Unable to price cart" },
        { status: 400 }
      );
    }

    // Link to an existing account if the email matches one (guest-friendly).
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || null;

    // Create the pending order + items.
    let orderNumber = generateOrderNumber();
    // Extremely unlikely collision guard.
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
        currency: priced.currency,
        subtotalCents: priced.subtotalCents,
        totalCents: priced.totalCents,
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

    // Create the matching PayPal order.
    const paypalOrder = await createPayPalOrder({
      amountCents: priced.totalCents,
      currency: priced.currency,
      referenceId: order.id,
      description: `Order ${order.orderNumber}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId: paypalOrder.id },
    });

    return NextResponse.json({
      orderId: order.id,
      paypalOrderId: paypalOrder.id,
      totalCents: priced.totalCents,
      currency: priced.currency,
    });
  } catch (error) {
    console.error("Store checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}

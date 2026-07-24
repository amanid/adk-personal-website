import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileOrderSchema } from "@/lib/validations";
import { priceCart, generateOrderNumber, secureToken } from "@/lib/store";
import { sendOrderInvoiceEmail } from "@/lib/email";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

function localeFromReferer(request: Request): "en" | "fr" {
  const referer = request.headers.get("referer") || "";
  return referer.includes("/fr/") || referer.endsWith("/fr") ? "fr" : "en";
}

export const runtime = "nodejs";

/**
 * Create a mobile-money order (Wave / Djamo / Orange Money). The buyer pays the
 * merchant's number directly and submits the transaction reference; the order
 * stays PENDING until an admin confirms the payment. No download is unlocked here.
 */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;

  const limited = rateLimit(request, { limit: 15, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = mobileOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, provider, reference, items } = validation.data;

    // Recompute prices server-side — client amounts are never trusted.
    let priced;
    try {
      priced = await priceCart(items);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Unable to price cart" },
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
        paymentMethod: provider,
        paymentReference: reference ? sanitizeInput(reference) : null,
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

    // Email the invoice with payment + WhatsApp instructions (best-effort).
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const locale = localeFromReferer(request);
    sendOrderInvoiceEmail({
      to: order.email,
      name: order.name,
      orderNumber: order.orderNumber,
      currency: priced.currency,
      totalCents: priced.totalCents,
      items: priced.items.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        lineTotalCents: i.lineTotalCents,
      })),
      provider,
      receiptUrl: `${appUrl}/${locale}/store/receipt/${order.receiptToken}`,
    }).catch((err) => console.error("Invoice email failed:", err));

    return NextResponse.json({ receiptToken: order.receiptToken });
  } catch (error) {
    console.error("Mobile order error:", error);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}

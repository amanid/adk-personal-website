import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder } from "@/lib/paypal";
import { createDownloadGrants } from "@/lib/store";
import { sendOrderReceiptEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

export const runtime = "nodejs";

function localeFromReferer(request: Request): "en" | "fr" {
  const referer = request.headers.get("referer") || "";
  return referer.includes("/fr/") || referer.endsWith("/fr") ? "fr" : "en";
}

async function sendReceipt(orderId: string, locale: "en" | "fr") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, downloads: true },
  });
  if (!order || order.status !== "PAID") return;

  const bookTitles = new Map(order.items.map((i) => [i.bookId, i.titleSnapshot]));

  await sendOrderReceiptEmail({
    to: order.email,
    name: order.name,
    orderNumber: order.orderNumber,
    paidAt: order.paidAt ?? new Date(),
    currency: order.currency,
    totalCents: order.totalCents,
    items: order.items.map((i) => ({
      title: i.titleSnapshot,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      lineTotalCents: i.unitPriceCents * i.quantity,
    })),
    downloads: order.downloads.map((d) => ({
      title: bookTitles.get(d.bookId) || "Your book",
      url: `${appUrl}/api/store/download/${d.token}`,
    })),
    receiptUrl: `${appUrl}/${locale}/store/receipt/${order.receiptToken}`,
  });
}

export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;

  const limited = rateLimit(request, { limit: 20, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : null;
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotent: already paid — return the existing receipt.
    if (order.status === "PAID") {
      return NextResponse.json({ receiptToken: order.receiptToken });
    }

    if (!order.paypalOrderId) {
      return NextResponse.json({ error: "Order not ready for payment" }, { status: 400 });
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

    // Mark paid + create download grants atomically.
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paypalCaptureId: capture.captureId,
        },
      });
      await createDownloadGrants(tx, order.id);
    });

    // Send the receipt email (best-effort — never block the buyer's downloads).
    try {
      await sendReceipt(order.id, localeFromReferer(request));
    } catch (err) {
      console.error("Receipt email failed:", err);
    }

    return NextResponse.json({ receiptToken: order.receiptToken });
  } catch (error) {
    console.error("Store capture error:", error);
    return NextResponse.json({ error: "Capture failed" }, { status: 500 });
  }
}

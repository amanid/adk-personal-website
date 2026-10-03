/**
 * Creating and starting payment for an Order — shared by everything the site
 * sells (bookstore, consulting bookings, quote payments).
 *
 * Callers price on the server and pass the result here; this module never
 * computes an amount itself, and nothing in it trusts the client.
 */
import { after } from "next/server";
import type { OrderKind, PaymentMethod, QuoteStage } from "@prisma/client";
import { prisma } from "./prisma";
import { generateOrderNumber, secureToken } from "./store";
import { createPayPalOrder } from "./paypal";
import { sendOrderInvoiceEmail, notifyAdminOfManualOrder, type InvoiceCopy } from "./email";

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function localeFromReferer(request: Request): "en" | "fr" {
  const referer = request.headers.get("referer") || "";
  return referer.includes("/fr/") || referer.endsWith("/fr") ? "fr" : "en";
}

export interface OrderLine {
  /** Set for a downloadable book; null for a service line. */
  bookId: string | null;
  title: string;
  unitPriceCents: number;
  quantity: number;
}

export interface NewOrder {
  kind?: OrderKind;
  quoteId?: string | null;
  quoteStage?: QuoteStage | null;
  email: string;
  name?: string | null;
  currency: string;
  lines: OrderLine[];
  subtotalCents: number;
  discountCents?: number;
  couponId?: string | null;
  couponCode?: string | null;
  totalCents: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string | null;
  ipAddress?: string | null;
}

/** Persist a PENDING order with its lines; links a matching account by email. */
export async function createOrderRecord(input: NewOrder) {
  if (input.totalCents < 0 || input.subtotalCents < 0) throw new Error("Invalid amount");

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: input.email, mode: "insensitive" } },
    select: { id: true },
  });

  let orderNumber = generateOrderNumber();
  // Extremely unlikely collision guard.
  for (let i = 0; i < 3; i++) {
    const exists = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
    if (!exists) break;
    orderNumber = generateOrderNumber();
  }

  return prisma.order.create({
    data: {
      orderNumber,
      kind: input.kind ?? "STORE",
      quoteId: input.quoteId ?? null,
      quoteStage: input.quoteStage ?? null,
      email: input.email,
      name: input.name || null,
      userId: existingUser?.id ?? null,
      status: "PENDING",
      ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
      paymentReference: input.paymentReference ?? null,
      currency: input.currency,
      subtotalCents: input.subtotalCents,
      discountCents: input.discountCents ?? 0,
      couponId: input.couponId ?? null,
      couponCode: input.couponCode ?? null,
      totalCents: input.totalCents,
      receiptToken: secureToken(),
      ipAddress: input.ipAddress ?? null,
      items: {
        create: input.lines.map((l) => ({
          bookId: l.bookId,
          titleSnapshot: l.title,
          unitPriceCents: l.unitPriceCents,
          quantity: l.quantity,
        })),
      },
    },
  });
}

/** Create the PayPal order for a pending Order and remember its id. */
export async function startPayPalPayment(order: {
  id: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
}): Promise<{ orderId: string; paypalOrderId: string }> {
  const paypalOrder = await createPayPalOrder({
    amountCents: order.totalCents,
    currency: order.currency,
    referenceId: order.id,
    description: `Order ${order.orderNumber}`,
  });
  await prisma.order.update({ where: { id: order.id }, data: { paypalOrderId: paypalOrder.id } });
  return { orderId: order.id, paypalOrderId: paypalOrder.id };
}

/**
 * After a manual-payment order (mobile money, direct PayPal transfer) is placed:
 * email the buyer their invoice and tell the admin a payment awaits
 * confirmation. Runs after the response, via after(), so neither the buyer nor
 * the result depends on SMTP — and so the work isn't cut off when it ends.
 */
export function notifyManualOrder(
  order: {
    id: string;
    orderNumber: string;
    email: string;
    name: string | null;
    currency: string;
    subtotalCents: number;
    discountCents: number;
    couponCode: string | null;
    totalCents: number;
    receiptToken: string;
    paymentReference: string | null;
  },
  lines: OrderLine[],
  provider: string,
  locale: "en" | "fr",
  copy?: InvoiceCopy
): void {
  const base = appUrl();
  const items = lines.map((l) => ({
    title: l.title,
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents,
    lineTotalCents: l.unitPriceCents * l.quantity,
  }));

  after(async () => {
    try {
      await sendOrderInvoiceEmail({
        to: order.email,
        name: order.name,
        orderNumber: order.orderNumber,
        currency: order.currency,
        subtotalCents: order.subtotalCents,
        discountCents: order.discountCents,
        couponCode: order.couponCode,
        totalCents: order.totalCents,
        items,
        provider,
        receiptUrl: `${base}/${locale}/store/receipt/${order.receiptToken}`,
        copy,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { invoiceEmailedAt: new Date(), lastEmailError: null },
      });
    } catch (err) {
      console.error("Invoice email failed:", err);
      await prisma.order
        .update({
          where: { id: order.id },
          data: { lastEmailError: String((err as Error)?.message || err).slice(0, 500) },
        })
        .catch(() => {});
    }
    // A manual payment is only money once the admin confirms it, so tell
    // them an order is waiting. Never let this failure mask the invoice.
    try {
      await notifyAdminOfManualOrder({
        orderNumber: order.orderNumber,
        buyerEmail: order.email,
        buyerName: order.name,
        provider,
        currency: order.currency,
        totalCents: order.totalCents,
        paymentReference: order.paymentReference,
        items,
        adminUrl: `${base}/${locale}/admin/store/orders`,
      });
    } catch (err) {
      console.error("Admin new-order notification failed:", err);
    }
  });
}

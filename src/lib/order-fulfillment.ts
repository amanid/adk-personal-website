import { prisma } from "./prisma";
import { createDownloadGrants } from "./store";
import { sendOrderReceiptEmail } from "./email";
import { confirmBookingForOrder, releaseBookingForOrder } from "./booking";
import { sendBookingConfirmation } from "./booking-notify";
import { markQuoteStagePaid } from "./quotes";
import { sendQuotePaymentReceived } from "./quote-notify";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Email the receipt + secure download links for a PAID order (best-effort). */
export async function sendOrderReceipt(
  orderId: string,
  locale: "en" | "fr" = "en"
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, downloads: true, booking: { include: { package: true } }, quote: true },
  });
  if (!order || order.status !== "PAID") return;

  // A booking's "receipt" is its confirmation, with the calendar invite.
  if (order.kind === "BOOKING") {
    if (order.booking) await sendBookingConfirmation(order.booking);
    return;
  }
  if (order.kind === "QUOTE") {
    if (order.quote && order.quoteStage) {
      await sendQuotePaymentReceived(order.quote, order.quoteStage, order.totalCents);
    }
    return;
  }

  const titles = new Map(order.items.map((i) => [i.bookId, i.titleSnapshot]));
  const base = appUrl();

  await sendOrderReceiptEmail({
    to: order.email,
    name: order.name,
    orderNumber: order.orderNumber,
    paidAt: order.paidAt ?? new Date(),
    currency: order.currency,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    couponCode: order.couponCode,
    totalCents: order.totalCents,
    items: order.items.map((i) => ({
      title: i.titleSnapshot,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      lineTotalCents: i.unitPriceCents * i.quantity,
    })),
    downloads: order.downloads.map((d) => ({
      title: titles.get(d.bookId) || "Your book",
      url: `${base}/api/store/download/${d.token}`,
    })),
    receiptUrl: `${base}/${locale}/store/receipt/${order.receiptToken}`,
  });
}

/** A free order whose coupon ran out between pricing and fulfilment. */
export class CouponExhaustedError extends Error {
  constructor() {
    super("Coupon redemption limit reached");
    this.name = "CouponExhaustedError";
  }
}

/**
 * Mark an order PAID (idempotent), create its download grants, and email the
 * receipt. Shared by PayPal capture, the PayPal webhook, and admin manual
 * confirmation of mobile-money orders.
 */
export async function fulfilPaidOrder(
  orderId: string,
  opts: { paypalCaptureId?: string | null; locale?: "en" | "fr" } = {}
): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return false;

  if (order.status !== "PAID") {
    await prisma.$transaction(async (tx) => {
      // Flip the status conditionally, inside the transaction. PayPal capture
      // and the webhook can arrive together; with a read-then-write both saw
      // "not PAID" and both created grants and counted the coupon twice. Only
      // the caller whose update actually changes the row carries on.
      const flipped = await tx.order.updateMany({
        where: { id: orderId, status: { not: "PAID" } },
        data: {
          status: "PAID",
          paidAt: order.paidAt ?? new Date(),
          ...(opts.paypalCaptureId ? { paypalCaptureId: opts.paypalCaptureId } : {}),
        },
      });
      if (flipped.count === 0) return;
      // Count the redemption exactly once, when the order first becomes PAID,
      // and enforce the cap in the same statement: the check made at pricing
      // time can be raced by parallel requests for a single-use code.
      if (order.couponId) {
        const counted = await tx.coupon.updateMany({
          where: {
            id: order.couponId,
            OR: [{ maxRedemptions: null }, { timesRedeemed: { lt: tx.coupon.fields.maxRedemptions } }],
          },
          data: { timesRedeemed: { increment: 1 } },
        });
        if (counted.count === 0) {
          // Nothing was paid for a free order, so refuse it (rolls back).
          if (order.totalCents === 0) throw new CouponExhaustedError();
          // Money has been taken: honour the order, still count the use.
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { timesRedeemed: { increment: 1 } },
          });
        }
      }
      await createDownloadGrants(tx, orderId);
      if (order.kind === "BOOKING") await confirmBookingForOrder(tx, orderId);
      if (order.kind === "QUOTE") await markQuoteStagePaid(tx, orderId);
    });
  }

  await deliverReceipt(orderId, opts.locale ?? "en");
  return true;
}

/**
 * Send the receipt and record the outcome on the order. Never throws: a mail
 * failure must not roll back a payment that already succeeded, so the error is
 * stored on the order for the admin to see and retry.
 *
 * Returns null on success, or the error message on failure.
 */
export async function deliverReceipt(
  orderId: string,
  locale: "en" | "fr" = "en"
): Promise<string | null> {
  try {
    await sendOrderReceipt(orderId, locale);
    await prisma.order.update({
      where: { id: orderId },
      data: { receiptEmailedAt: new Date(), lastEmailError: null },
    });
    return null;
  } catch (err) {
    const message = String((err as Error)?.message || err).slice(0, 500);
    console.error("Receipt email failed:", err);
    await prisma.order
      .update({ where: { id: orderId }, data: { lastEmailError: message } })
      .catch(() => {});
    return message;
  }
}

/**
 * Mark an unpaid order CANCELLED or FAILED and release whatever it was
 * holding (a booking's time slot). A PAID order is never touched here.
 */
export async function voidUnpaidOrder(orderId: string, status: "CANCELLED" | "FAILED"): Promise<void> {
  const res = await prisma.order.updateMany({
    where: { id: orderId, status: { not: "PAID" } },
    data: { status },
  });
  if (res.count > 0) await releaseBookingForOrder(orderId);
}

/** After a refund or reversal: revoke downloads and cancel any booking. */
export async function revokeRefundedOrder(orderId: string): Promise<void> {
  await prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } }).catch(() => {});
  await prisma.downloadGrant
    .updateMany({ where: { orderId }, data: { expiresAt: new Date(0) } })
    .catch(() => {});
  await prisma.booking
    .updateMany({
      where: { orderId, status: { notIn: ["CANCELLED", "COMPLETED"] } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    })
    .catch(() => {});
}

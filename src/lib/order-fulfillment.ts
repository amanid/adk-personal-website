import { prisma } from "./prisma";
import { createDownloadGrants } from "./store";
import { sendOrderReceiptEmail } from "./email";

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
    include: { items: true, downloads: true },
  });
  if (!order || order.status !== "PAID") return;

  const titles = new Map(order.items.map((i) => [i.bookId, i.titleSnapshot]));
  const base = appUrl();

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
      title: titles.get(d.bookId) || "Your book",
      url: `${base}/api/store/download/${d.token}`,
    })),
    receiptUrl: `${base}/${locale}/store/receipt/${order.receiptToken}`,
  });
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
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: order.paidAt ?? new Date(),
          ...(opts.paypalCaptureId ? { paypalCaptureId: opts.paypalCaptureId } : {}),
        },
      });
      await createDownloadGrants(tx, orderId);
    });
  }

  try {
    await sendOrderReceipt(orderId, opts.locale ?? "en");
    await prisma.order.update({
      where: { id: orderId },
      data: { receiptEmailedAt: new Date(), lastEmailError: null },
    });
  } catch (err) {
    console.error("Receipt email failed:", err);
    await prisma.order
      .update({
        where: { id: orderId },
        data: { lastEmailError: String((err as Error)?.message || err).slice(0, 500) },
      })
      .catch(() => {});
  }
  return true;
}

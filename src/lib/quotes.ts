/**
 * Project quotes: a priced scope the client accepts online, then pays in up
 * to two stages — a deposit on acceptance and the balance when requested.
 * Each payment is an Order (kind QUOTE) through the shared pipeline, so the
 * amounts here are the only source of what a client owes.
 */
import { randomBytes } from "crypto";
import type { Prisma, Quote, QuoteStage } from "@prisma/client";
import { z } from "zod";

export const quoteItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amountCents: z.number().int().min(0).max(100_000_000_00),
});
export const quoteItemsSchema = z.array(quoteItemSchema).min(1).max(50);
export type QuoteItem = z.infer<typeof quoteItemSchema>;

export function parseItems(json: Prisma.JsonValue): QuoteItem[] {
  const r = quoteItemsSchema.safeParse(json);
  return r.success ? r.data : [];
}

export function quoteAmounts(items: QuoteItem[], depositPercent: number) {
  const totalCents = items.reduce((s, i) => s + i.amountCents, 0);
  const pct = Math.min(Math.max(Math.round(depositPercent), 0), 100);
  // Round the deposit to whole minor units; the balance takes the remainder,
  // so deposit + balance is always exactly the total.
  const depositCents = Math.round((totalCents * pct) / 100);
  return { totalCents, depositPercent: pct, depositCents, balanceCents: totalCents - depositCents };
}

export function generateQuoteNumber(): string {
  return `Q-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function isQuoteExpired(q: Pick<Quote, "validUntil" | "status">, now = new Date()): boolean {
  return q.status === "SENT" && !!q.validUntil && q.validUntil.getTime() < now.getTime();
}

/** What the client can pay right now, if anything. */
export function amountDue(
  q: Pick<Quote, "status" | "totalCents" | "depositCents" | "depositPaidAt">
): { stage: QuoteStage; amountCents: number } | null {
  if (q.status === "ACCEPTED" && q.depositCents > 0) return { stage: "DEPOSIT", amountCents: q.depositCents };
  if (q.status === "BALANCE_DUE") {
    const amount = q.totalCents - (q.depositPaidAt ? q.depositCents : 0);
    return amount > 0 ? { stage: "BALANCE", amountCents: amount } : null;
  }
  return null;
}

/**
 * Inside the payment transaction: record that an order paid its quote stage.
 * A deposit covering the whole total settles the quote outright.
 */
export async function markQuoteStagePaid(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { quoteId: true, quoteStage: true },
  });
  if (!order?.quoteId || !order.quoteStage) return;
  const q = await tx.quote.findUnique({ where: { id: order.quoteId } });
  if (!q) return;
  const now = new Date();
  if (order.quoteStage === "DEPOSIT") {
    const settled = q.depositCents >= q.totalCents;
    await tx.quote.update({
      where: { id: q.id },
      data: { depositPaidAt: now, status: settled ? "PAID" : "DEPOSIT_PAID", ...(settled ? { paidAt: now } : {}) },
    });
  } else {
    await tx.quote.update({ where: { id: q.id }, data: { status: "PAID", paidAt: now } });
  }
}

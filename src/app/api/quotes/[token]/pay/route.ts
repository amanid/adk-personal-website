import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quotePaySchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { sanitizeInput } from "@/lib/sanitize";
import { quoteByToken } from "@/lib/quote-access";
import { amountDue } from "@/lib/quotes";
import { createOrderRecord, notifyManualOrder, startPayPalPayment } from "@/lib/orders";
import { voidUnpaidOrder } from "@/lib/order-fulfillment";
import { isPaypalCurrency } from "@/lib/currency";

export const runtime = "nodejs";

/**
 * Start paying whatever the quote currently has due (deposit or balance).
 * The amount comes from the quote in the database, never from the request.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const { token } = await params;
    const parsed = quotePaySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const input = parsed.data;
    if (input.payment === "MANUAL" && !input.provider) {
      return NextResponse.json({ error: "Choose how you will pay." }, { status: 400 });
    }

    const q = await quoteByToken(token);
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const due = amountDue(q);
    if (!due) return NextResponse.json({ error: "Nothing is due on this proposal right now." }, { status: 409 });
    if (input.payment === "PAYPAL" && !isPaypalCurrency(q.currency)) {
      return NextResponse.json({ error: "PayPal can't settle this currency." }, { status: 400 });
    }

    // One live attempt per stage: a fresh one supersedes an unpaid earlier one,
    // so the admin never sees two pending orders for the same deposit.
    const stale = await prisma.order.findMany({
      where: { quoteId: q.id, quoteStage: due.stage, status: "PENDING" },
      select: { id: true },
    });
    for (const o of stale) await voidUnpaidOrder(o.id, "CANCELLED");

    const fr = q.locale === "fr";
    const label =
      due.stage === "DEPOSIT" ? (fr ? `Acompte (${q.depositPercent} %)` : `Deposit (${q.depositPercent}%)`) : fr ? "Solde" : "Balance";
    const lines = [{ bookId: null, title: `${q.number} — ${q.title} · ${label}`, unitPriceCents: due.amountCents, quantity: 1 }];
    const order = await createOrderRecord({
      kind: "QUOTE",
      quoteId: q.id,
      quoteStage: due.stage,
      email: q.clientEmail,
      name: q.clientName,
      currency: q.currency,
      lines,
      subtotalCents: due.amountCents,
      totalCents: due.amountCents,
      ...(input.payment === "MANUAL"
        ? { paymentMethod: input.provider, paymentReference: input.reference ? sanitizeInput(input.reference) : null }
        : {}),
      ipAddress: clientIp(request),
    });

    if (input.payment === "PAYPAL") {
      try {
        return NextResponse.json(await startPayPalPayment(order));
      } catch (err) {
        await voidUnpaidOrder(order.id, "CANCELLED");
        throw err;
      }
    }

    notifyManualOrder(order, lines, input.provider!, fr ? "fr" : "en", {
      label: "Consulting &middot; Invoice",
      afterPayment: "Once the payment is confirmed, you'll receive a receipt and the project moves to the next stage.",
      footer: "Thank you for your trust.",
    });
    return NextResponse.json({ receiptToken: order.receiptToken });
  } catch (error) {
    console.error("Quote payment error:", error);
    return NextResponse.json({ error: "Could not start the payment." }, { status: 500 });
  }
}

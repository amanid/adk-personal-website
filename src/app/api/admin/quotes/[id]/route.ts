import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { quoteInputSchema } from "@/lib/validations";
import { amountDue, quoteAmounts } from "@/lib/quotes";
import { sendBalanceRequest, sendQuoteToClient } from "@/lib/quote-notify";
import { voidUnpaidOrder } from "@/lib/order-fulfillment";

export const runtime = "nodejs";

/** Edit a quote. Only before the client has accepted it: after that it's a contract. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const q = await prisma.quote.findUnique({ where: { id } });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (q.status !== "DRAFT" && q.status !== "SENT") {
    return NextResponse.json({ error: "An accepted quote can't be edited; cancel it and issue a new one." }, { status: 409 });
  }
  const parsed = quoteInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const a = quoteAmounts(d.items, d.depositPercent);
  const quote = await prisma.quote.update({
    where: { id },
    data: {
      clientName: d.clientName,
      clientEmail: d.clientEmail.trim().toLowerCase(),
      company: d.company || null,
      title: d.title,
      scope: d.scope,
      items: d.items,
      currency: d.currency,
      totalCents: a.totalCents,
      depositPercent: a.depositPercent,
      depositCents: a.depositCents,
      validUntil: d.validUntil ? new Date(d.validUntil) : null,
      locale: d.locale,
      internalNotes: d.internalNotes || null,
    },
  });
  return NextResponse.json({ quote });
}

/** Workflow actions: send (or re-send), request the balance, cancel. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const action = (await request.json().catch(() => null))?.action;
  const q = await prisma.quote.findUnique({ where: { id } });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    if (action === "send") {
      if (q.status !== "DRAFT" && q.status !== "SENT") {
        return NextResponse.json({ error: "Only a draft or sent quote can be sent." }, { status: 409 });
      }
      const sent = await prisma.quote.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
      await sendQuoteToClient(sent);
      return NextResponse.json({ quote: sent, message: `Sent to ${sent.clientEmail}.` });
    }

    if (action === "request-balance") {
      const ready = q.status === "DEPOSIT_PAID" || (q.status === "ACCEPTED" && q.depositCents === 0);
      if (!ready) return NextResponse.json({ error: "The balance can be requested once the deposit is paid." }, { status: 409 });
      const updated = await prisma.quote.update({
        where: { id },
        data: { status: "BALANCE_DUE", balanceRequestedAt: new Date() },
      });
      const due = amountDue(updated);
      if (!due) return NextResponse.json({ error: "Nothing remains to be paid." }, { status: 409 });
      await sendBalanceRequest(updated, due.amountCents);
      return NextResponse.json({ quote: updated, message: `Balance request sent to ${updated.clientEmail}.` });
    }

    if (action === "cancel") {
      if (q.status === "PAID") return NextResponse.json({ error: "A paid quote can't be cancelled." }, { status: 409 });
      const pending = await prisma.order.findMany({ where: { quoteId: id, status: "PENDING" }, select: { id: true } });
      for (const o of pending) await voidUnpaidOrder(o.id, "CANCELLED");
      const updated = await prisma.quote.update({ where: { id }, data: { status: "CANCELLED" } });
      return NextResponse.json({ quote: updated, message: "Quote cancelled. Refund any payment already received separately." });
    }
  } catch (err) {
    // The state change is saved; only the email failed.
    return NextResponse.json(
      { warning: `Saved, but the email failed: ${String((err as Error)?.message || err).slice(0, 200)}` },
      { status: 200 }
    );
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

/** Only drafts can be deleted; anything the client has seen is kept. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const res = await prisma.quote.deleteMany({ where: { id, status: "DRAFT" } });
  if (res.count === 0) return NextResponse.json({ error: "Only a draft can be deleted." }, { status: 409 });
  return NextResponse.json({ ok: true });
}

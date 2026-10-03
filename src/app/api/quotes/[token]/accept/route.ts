import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { quoteAcceptSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { sanitizeInput } from "@/lib/sanitize";
import { quoteByToken } from "@/lib/quote-access";
import { isQuoteExpired } from "@/lib/quotes";
import { notifyAdmin } from "@/lib/quote-notify";
import { emitWebhook } from "@/lib/webhooks";

/** The client accepts the quote, typing their name as a signature. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const { token } = await params;
  const parsed = quoteAcceptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const q = await quoteByToken(token);
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isQuoteExpired(q)) return NextResponse.json({ error: "This proposal has expired." }, { status: 410 });

  // Conditional update: only a SENT quote can be accepted, exactly once.
  const res = await prisma.quote.updateMany({
    where: { id: q.id, status: "SENT" },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      acceptedName: sanitizeInput(parsed.data.name).slice(0, 200),
      acceptedIp: clientIp(request),
    },
  });
  if (res.count === 0) return NextResponse.json({ error: "This proposal can no longer be accepted." }, { status: 409 });

  await emitWebhook("quote.accepted", {
    quote_id: q.id,
    quote_number: q.number,
    title: q.title,
    client_name: q.clientName,
    client_email: q.clientEmail,
    company: q.company,
    currency: q.currency,
    total_cents: q.totalCents,
    deposit_cents: q.depositCents,
  });
  after(() =>
    notifyAdmin(`Quote accepted: ${q.number} — ${q.clientName}`, `${q.clientName} accepted “${q.title}”.`, q).catch(
      (e) => console.error("Quote accepted alert failed:", e)
    )
  );
  return NextResponse.json({ ok: true });
}

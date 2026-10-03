import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { quoteDeclineSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { sanitizeInput } from "@/lib/sanitize";
import { quoteByToken } from "@/lib/quote-access";
import { notifyAdmin } from "@/lib/quote-notify";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  const { token } = await params;
  const parsed = quoteDeclineSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const q = await quoteByToken(token);
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reason = parsed.data.reason ? sanitizeInput(parsed.data.reason).slice(0, 2000) : null;
  const res = await prisma.quote.updateMany({
    where: { id: q.id, status: "SENT" },
    data: { status: "DECLINED", declinedAt: new Date(), declineReason: reason },
  });
  if (res.count === 0) return NextResponse.json({ error: "This proposal can no longer be declined." }, { status: 409 });

  after(() =>
    notifyAdmin(
      `Quote declined: ${q.number} — ${q.clientName}`,
      `${q.clientName} declined “${q.title}”.${reason ? ` Reason: ${reason}` : ""}`,
      q
    ).catch((e) => console.error("Quote declined alert failed:", e))
  );
  return NextResponse.json({ ok: true });
}

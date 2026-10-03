import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { quoteInputSchema } from "@/lib/validations";
import { generateQuoteNumber, quoteAmounts } from "@/lib/quotes";
import { secureToken } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const fromRequest = new URL(request.url).searchParams.get("fromRequest");
  const [quotes, prefill] = await Promise.all([
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, status: true, quoteStage: true, totalCents: true, paymentMethod: true },
        },
      },
    }),
    fromRequest
      ? prisma.serviceRequest.findUnique({
          where: { id: fromRequest },
          select: { id: true, name: true, email: true, company: true, serviceType: true, description: true, budget: true },
        })
      : null,
  ]);
  return NextResponse.json({ quotes, prefill });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = quoteInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const a = quoteAmounts(d.items, d.depositPercent);
  let number = generateQuoteNumber();
  for (let i = 0; i < 3 && (await prisma.quote.findUnique({ where: { number } })); i++) number = generateQuoteNumber();

  const quote = await prisma.quote.create({
    data: {
      number,
      token: secureToken(),
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
      serviceRequestId: d.serviceRequestId || null,
    },
  });
  return NextResponse.json({ quote }, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderLookupEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

export const runtime = "nodejs";

function localeFromReferer(request: Request): "en" | "fr" {
  const referer = request.headers.get("referer") || "";
  return referer.includes("/fr/") || referer.endsWith("/fr") ? "fr" : "en";
}

/**
 * Self-serve order recovery. The buyer submits their email; if any orders
 * exist, we EMAIL them the (unguessable) receipt links — we never reveal on
 * screen whether an address has orders, and never return order data in the
 * response. This prevents enumeration and stops anyone from pulling another
 * person's downloads just by typing their email.
 */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;

  // Tight limit — this endpoint sends email and must not be a spam vector.
  const limited = rateLimit(request, { limit: 5, windowSeconds: 300 });
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Always return the same response regardless of whether orders exist.
    const ok = NextResponse.json({ ok: true });
    if (!valid) return ok;

    const orders = await prisma.order.findMany({
      where: { email, status: { in: ["PAID", "PENDING"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        currency: true,
        totalCents: true,
        receiptToken: true,
      },
    });

    if (orders.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const locale = localeFromReferer(request);
      try {
        await sendOrderLookupEmail(
          email,
          orders.map((o) => ({
            orderNumber: o.orderNumber,
            status: o.status,
            createdAt: o.createdAt,
            currency: o.currency,
            totalCents: o.totalCents,
            receiptUrl: `${appUrl}/${locale}/store/receipt/${o.receiptToken}`,
          }))
        );
      } catch (err) {
        // Don't leak whether the email exists via an error path.
        console.error("Order lookup email failed:", err);
      }
    }

    return ok;
  } catch (error) {
    console.error("Order lookup error:", error);
    // Still generic — never disclose internal detail.
    return NextResponse.json({ ok: true });
  }
}

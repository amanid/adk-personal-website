import { NextResponse } from "next/server";
import { priceCart } from "@/lib/store";
import { applyCoupon } from "@/lib/coupon";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

export const runtime = "nodejs";

/** Preview a coupon against the current cart. Prices are recomputed server-side. */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  // Kept deliberately low: this endpoint reveals whether a code is valid, so a
  // tight limit blunts brute-force enumeration of coupon codes.
  const limited = rateLimit(request, { limit: 12, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";
    const items = Array.isArray(body?.items) ? body.items : [];

    let priced;
    try {
      priced = await priceCart(items);
    } catch (e) {
      return NextResponse.json(
        { valid: false, error: e instanceof Error ? e.message : "Unable to price cart" },
        { status: 400 }
      );
    }

    try {
      const applied = await applyCoupon(code, priced.subtotalCents, priced.currency);
      return NextResponse.json({
        valid: true,
        code: applied.code,
        currency: priced.currency,
        subtotalCents: priced.subtotalCents,
        discountCents: applied.discountCents,
        totalCents: Math.max(0, priced.subtotalCents - applied.discountCents),
      });
    } catch (e) {
      return NextResponse.json({
        valid: false,
        error: e instanceof Error ? e.message : "Invalid coupon",
      });
    }
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
  }
}

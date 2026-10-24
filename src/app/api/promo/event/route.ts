import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BODY = 1024;
const ID = /^[a-z0-9-]{1,120}$/;

/**
 * Records a house-ad impression or click. Anonymous writes into a small
 * table: every field is validated against a short pattern, bodies are capped
 * and each client is throttled, and the answer is always 200 so the beacon
 * never retries.
 */
export async function POST(request: Request) {
  if (rateLimit(request, { limit: 90, windowSeconds: 60 })) return NextResponse.json({ ok: true });
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return NextResponse.json({ ok: true });
    const body = JSON.parse(raw) as Record<string, unknown>;
    const placement = typeof body.placement === "string" ? body.placement : "";
    const itemKind = typeof body.itemKind === "string" ? body.itemKind : "";
    const itemSlug = typeof body.itemSlug === "string" ? body.itemSlug : "";
    const event = typeof body.event === "string" ? body.event : "";
    if (!ID.test(placement) || !ID.test(itemSlug) || !["book", "publication"].includes(itemKind) || !["impression", "click"].includes(event)) {
      return NextResponse.json({ ok: true });
    }
    await prisma.promoEvent.create({ data: { placement, itemKind, itemSlug, event } });
  } catch {
    /* never surface to the visitor */
  }
  return NextResponse.json({ ok: true });
}

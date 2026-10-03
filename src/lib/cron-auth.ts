import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Scheduled jobs authenticate with `Authorization: Bearer <CRON_SECRET>`.
 * Returns the response to send when the caller isn't allowed, else null.
 */
export function checkCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const given = Buffer.from((request.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

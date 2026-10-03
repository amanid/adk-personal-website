import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runSalesAutomation } from "@/lib/sales-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled run of the sales emails. Call hourly from any scheduler (a Render
 * cron job, cron-job.org, a GitHub Actions schedule…) with
 *   Authorization: Bearer <CRON_SECRET>
 * Disabled until CRON_SECRET is set.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const given = Buffer.from((request.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runSalesAutomation());
}

export const GET = handle;
export const POST = handle;

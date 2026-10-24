import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { runSalesAutomation } from "@/lib/sales-emails";
import { retryDueWebhooks } from "@/lib/webhooks";
import { purgeAbandonedUploads } from "@/lib/asset-store";
import { pruneBuckets } from "@/lib/rate-limit-db";
import { runMonthlyDigestIfDue } from "@/lib/digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One scheduled entry point for all background work — call it every 10–60
 * minutes with `Authorization: Bearer <CRON_SECRET>`:
 *   - sales emails (reminders, follow-ups)
 *   - webhook retries
 *   - removing book uploads started but never finished (over a day old)
 *   - dropping expired rate-limit buckets
 *   - the monthly brief to newsletter subscribers (once a month, when enabled)
 */
async function handle(request: Request) {
  const denied = checkCronAuth(request);
  if (denied) return denied;
  const [sales, webhooks, abandonedUploads, expiredBuckets, digest] = await Promise.all([
    runSalesAutomation(),
    retryDueWebhooks(),
    purgeAbandonedUploads(),
    pruneBuckets(),
    runMonthlyDigestIfDue().catch((e) => ({ skipped: `error: ${e instanceof Error ? e.message : String(e)}` })),
  ]);
  return NextResponse.json({ sales, webhooks, abandonedUploads, expiredBuckets, digest });
}

export const GET = handle;
export const POST = handle;

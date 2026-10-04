import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { runSalesAutomation } from "@/lib/sales-emails";
import { retryDueWebhooks } from "@/lib/webhooks";
import { purgeAbandonedUploads } from "@/lib/asset-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One scheduled entry point for all background work — call it every 10–60
 * minutes with `Authorization: Bearer <CRON_SECRET>`:
 *   - sales emails (reminders, follow-ups)
 *   - webhook retries
 *   - removing book uploads started but never finished (over a day old)
 */
async function handle(request: Request) {
  const denied = checkCronAuth(request);
  if (denied) return denied;
  const [sales, webhooks, abandonedUploads] = await Promise.all([runSalesAutomation(), retryDueWebhooks(), purgeAbandonedUploads()]);
  return NextResponse.json({ sales, webhooks, abandonedUploads });
}

export const GET = handle;
export const POST = handle;

import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { runSalesAutomation } from "@/lib/sales-emails";
import { retryDueWebhooks } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One scheduled entry point for all background work — call it every 10–60
 * minutes with `Authorization: Bearer <CRON_SECRET>`:
 *   - sales emails (reminders, follow-ups)
 *   - webhook retries
 */
async function handle(request: Request) {
  const denied = checkCronAuth(request);
  if (denied) return denied;
  const [sales, webhooks] = await Promise.all([runSalesAutomation(), retryDueWebhooks()]);
  return NextResponse.json({ sales, webhooks });
}

export const GET = handle;
export const POST = handle;

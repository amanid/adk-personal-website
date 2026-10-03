import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { runSalesAutomation } from "@/lib/sales-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sales emails only. Prefer /api/cron/tick, which also retries webhooks. */
async function handle(request: Request) {
  const denied = checkCronAuth(request);
  if (denied) return denied;
  return NextResponse.json(await runSalesAutomation());
}

export const GET = handle;
export const POST = handle;

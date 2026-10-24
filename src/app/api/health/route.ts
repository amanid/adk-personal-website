import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness only: no uptime or timestamps, which told callers when the
 *  instance (and its in-memory limiters) had last restarted. */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}

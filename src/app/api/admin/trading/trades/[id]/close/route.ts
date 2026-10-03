import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { checkOrigin } from "@/lib/origin-check";
import { closeTrade, oandaConfig, OandaError } from "@/lib/oanda";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const denied = await requireAdmin();
  if (denied) return denied;
  const cfg = oandaConfig();
  if (!cfg) return NextResponse.json({ error: "Trading isn't configured." }, { status: 503 });
  const { id } = await params;
  try {
    return NextResponse.json({ ok: true, fill: await closeTrade(cfg, id) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof OandaError ? e.message : "Could not reach OANDA." }, { status: 502 });
  }
}

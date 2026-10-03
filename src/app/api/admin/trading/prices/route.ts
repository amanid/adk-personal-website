import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getPricing, oandaConfig, OandaError } from "@/lib/oanda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const cfg = oandaConfig();
  if (!cfg) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const list = (new URL(request.url).searchParams.get("i") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[A-Z0-9]{2,12}_[A-Z0-9]{2,12}$/.test(s))
    .slice(0, 20);
  try {
    return NextResponse.json({ prices: await getPricing(cfg, list) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof OandaError ? e.message : "Could not reach OANDA." }, { status: 502 });
  }
}

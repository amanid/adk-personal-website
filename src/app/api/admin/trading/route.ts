import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getInstruments, getSummary, listOpenTrades, oandaConfig, OandaError } from "@/lib/oanda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Account snapshot for the desk: summary, open trades, tradable instruments. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const cfg = oandaConfig();
  if (!cfg) return NextResponse.json({ configured: false });
  try {
    const [summary, openTrades, instruments] = await Promise.all([getSummary(cfg), listOpenTrades(cfg), getInstruments(cfg)]);
    return NextResponse.json({
      configured: true,
      env: cfg.env,
      maxUnits: cfg.maxUnits,
      summary,
      openTrades,
      instruments: instruments.map((i) => ({ name: i.name, displayName: i.displayName, type: i.type, displayPrecision: i.displayPrecision, minimumTradeSize: i.minimumTradeSize })),
    });
  } catch (e) {
    return NextResponse.json({ configured: true, env: cfg.env, error: e instanceof OandaError ? e.message : "Could not reach OANDA." }, { status: 502 });
  }
}

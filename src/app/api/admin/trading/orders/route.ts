import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { checkOrigin } from "@/lib/origin-check";
import { rateLimit } from "@/lib/rate-limit";
import { oandaConfig, OandaError, placeMarketOrder } from "@/lib/oanda";

export const runtime = "nodejs";

const orderSchema = z.object({
  instrument: z.string().regex(/^[A-Z0-9]{2,12}_[A-Z0-9]{2,12}$/),
  side: z.enum(["BUY", "SELL"]),
  units: z.number().int().positive(),
  stopLoss: z.number().positive().nullable().optional(),
  takeProfit: z.number().positive().nullable().optional(),
  /** Required (true) when the desk is connected to a LIVE account. */
  confirmLive: z.boolean().optional(),
});

export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const denied = await requireAdmin();
  if (denied) return denied;
  const limited = rateLimit(request, { limit: 20, windowSeconds: 60 });
  if (limited) return limited;
  const cfg = oandaConfig();
  if (!cfg) return NextResponse.json({ error: "Trading isn't configured." }, { status: 503 });

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid order" }, { status: 400 });
  if (cfg.env === "live" && parsed.data.confirmLive !== true) {
    return NextResponse.json({ error: "Live account: confirm that this order uses real money." }, { status: 400 });
  }
  try {
    const fill = await placeMarketOrder(cfg, parsed.data);
    return NextResponse.json({ ok: true, fill });
  } catch (e) {
    const status = e instanceof OandaError ? (e.status >= 400 && e.status < 500 ? e.status : 502) : 502;
    return NextResponse.json({ error: e instanceof OandaError ? e.message : "Could not reach OANDA." }, { status });
  }
}

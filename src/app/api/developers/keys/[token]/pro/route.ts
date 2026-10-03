import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { keyByManageToken } from "@/lib/data-api-owner";
import { cancelApiPro, syncApiSubscription } from "@/lib/data-api-billing";

export const runtime = "nodejs";

/** POST { subscriptionId } after approving in PayPal → Pro. DELETE → stop renewal. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;
  const k = await keyByManageToken((await params).token);
  if (!k || k.status !== "ACTIVE") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId : "";
  if (!/^I-[A-Z0-9]{6,40}$/.test(subscriptionId)) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  try {
    const r = await syncApiSubscription(subscriptionId, k.id);
    if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 400 });
    return NextResponse.json(r);
  } catch (e) {
    console.error("API Pro activation error:", e);
    return NextResponse.json({ error: "Could not verify the subscription with PayPal." }, { status: 502 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const k = await keyByManageToken((await params).token);
  if (!k) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    if (!(await cancelApiPro(k.id))) return NextResponse.json({ error: "No Pro subscription." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not cancel with PayPal." }, { status: 502 });
  }
}

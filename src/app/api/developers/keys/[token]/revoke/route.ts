import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkOrigin } from "@/lib/origin-check";
import { keyByManageToken } from "@/lib/data-api-owner";
import { cancelApiPro } from "@/lib/data-api-billing";

export const runtime = "nodejs";

/** Revoke the key for good (and stop any Pro billing). */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const k = await keyByManageToken((await params).token);
  if (!k || k.status !== "ACTIVE") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (k.paypalSubscriptionId) await cancelApiPro(k.id).catch((e) => console.error("Pro cancel on revoke failed:", e));
  await prisma.apiKey.update({ where: { id: k.id }, data: { status: "REVOKED", revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

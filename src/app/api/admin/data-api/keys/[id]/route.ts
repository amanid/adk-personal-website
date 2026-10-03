import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  action: z.enum(["revoke", "grant_pro", "set_free"]),
  /** For grant_pro: until when (omit = no end, e.g. a partner). */
  until: z.string().datetime().optional(),
});

/** Admin overrides: revoke, or grant/withdraw Pro by hand (e.g. partners). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { action, until } = parsed.data;
  const data =
    action === "revoke" ? { status: "REVOKED" as const, revokedAt: new Date() }
    : action === "grant_pro" ? { plan: "PRO" as const, currentPeriodEnd: until ? new Date(until) : null }
    : { plan: "FREE" as const, currentPeriodEnd: null };
  const key = await prisma.apiKey.update({ where: { id }, data }).catch(() => null);
  if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { generateApiKey } from "@/lib/data-api";
import { keyByManageToken } from "@/lib/data-api-owner";
import { sendApiKeyEmail } from "@/lib/data-api-notify";

export const runtime = "nodejs";

/** Replace the key (e.g. after a leak). The new key is emailed; the old one stops at once. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 5, windowSeconds: 3600 });
  if (limited) return limited;
  const k = await keyByManageToken((await params).token);
  if (!k || k.status !== "ACTIVE") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { key, prefix, hash } = generateApiKey();
  try {
    await sendApiKeyEmail({ to: k.email, name: k.name, key, manageToken: k.manageToken, rotated: true });
  } catch {
    return NextResponse.json({ error: "We couldn't email the new key, so the current one was kept." }, { status: 502 });
  }
  await prisma.apiKey.update({ where: { id: k.id }, data: { keyPrefix: prefix, keyHash: hash } });
  return NextResponse.json({ ok: true, keyPrefix: prefix });
}

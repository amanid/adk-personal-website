import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { sanitizeInput } from "@/lib/sanitize";
import { secureToken } from "@/lib/store";
import { generateApiKey } from "@/lib/data-api";
import { sendApiKeyEmail } from "@/lib/data-api-notify";
import { emitWebhook } from "@/lib/webhooks";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(320),
  useCase: z.string().trim().min(10, "Tell me briefly what you'll build").max(1000),
  agree: z.literal(true),
});

/**
 * Request a free API key. It is emailed (which also proves the address);
 * the response never contains it. At most 3 active keys per address.
 */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 5, windowSeconds: 3600 });
  if (limited) return limited;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();

  const active = await prisma.apiKey.count({ where: { email, status: "ACTIVE" } });
  if (active >= 3) {
    // Same answer as success: don't reveal how many keys an address holds.
    return NextResponse.json({ ok: true });
  }
  const { key, prefix, hash } = generateApiKey();
  const manageToken = secureToken();
  const created = await prisma.apiKey.create({
    data: {
      name: sanitizeInput(parsed.data.name),
      email,
      useCase: sanitizeInput(parsed.data.useCase),
      keyPrefix: prefix,
      keyHash: hash,
      manageToken,
    },
  });
  try {
    await sendApiKeyEmail({ to: email, name: created.name, key, manageToken });
  } catch (err) {
    // The key can't be delivered: don't leave an unusable key behind.
    await prisma.apiKey.delete({ where: { id: created.id } }).catch(() => {});
    console.error("API key email failed:", err);
    return NextResponse.json({ error: "We couldn't email your key. Please try again later." }, { status: 502 });
  }
  await emitWebhook("api.key_created", { key_id: created.id, key_prefix: prefix, name: created.name, email, use_case: created.useCase });
  return NextResponse.json({ ok: true });
}

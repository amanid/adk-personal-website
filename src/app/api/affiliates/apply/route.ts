import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { affiliateApplySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { sanitizeInput } from "@/lib/sanitize";
import { secureToken } from "@/lib/store";
import { generateAffiliateCode, getAffiliateSettings } from "@/lib/affiliates";
import { notifyAdminOfApplication } from "@/lib/affiliate-notify";

/**
 * Apply to the affiliate program. Every application waits for the admin's
 * approval. The response is the same whether or not the email has applied
 * before, so the form can't be used to discover who is an affiliate.
 */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 5, windowSeconds: 3600 });
  if (limited) return limited;

  const parsed = affiliateApplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const email = d.email.trim().toLowerCase();

  const existing = await prisma.affiliate.findUnique({ where: { email }, select: { id: true } });
  if (!existing) {
    const { defaultPercent } = await getAffiliateSettings();
    const affiliate = await prisma.affiliate.create({
      data: {
        name: sanitizeInput(d.name),
        email,
        code: await generateAffiliateCode(d.name),
        commissionPercent: defaultPercent,
        website: d.website ? sanitizeInput(d.website).slice(0, 300) : null,
        pitch: sanitizeInput(d.pitch),
        payoutMethod: d.payoutMethod,
        payoutDetails: sanitizeInput(d.payoutDetails),
        dashboardToken: secureToken(),
        locale: d.locale === "fr" ? "fr" : "en",
      },
    });
    after(() => notifyAdminOfApplication(affiliate).catch((e) => console.error("Affiliate alert failed:", e)));
  }
  return NextResponse.json({ ok: true });
}

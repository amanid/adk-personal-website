import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { CODE_RE, REF_COOKIE, getAffiliateSettings, safeRedirectPath } from "@/lib/affiliates";

export const runtime = "nodejs";

/**
 * Referral link: /r/<code>?to=/en/store/some-book
 *
 * Records a click, remembers the affiliate in a first-party cookie for the
 * configured number of days, and redirects — only ever to a path on this
 * site. An unknown or inactive code still redirects, just without credit.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(request.url);
  const to = safeRedirectPath(url.searchParams.get("to"));
  const res = NextResponse.redirect(new URL(to, process.env.NEXT_PUBLIC_APP_URL || url.origin), 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");

  const normalized = code.toLowerCase();
  if (!CODE_RE.test(normalized)) return res;

  const affiliate = await prisma.affiliate
    .findUnique({ where: { code: normalized }, select: { id: true, status: true } })
    .catch(() => null);
  if (!affiliate || affiliate.status !== "APPROVED") return res;

  // Counting is throttled per visitor so a refresh loop can't inflate clicks.
  if (!rateLimit(request, { limit: 20, windowSeconds: 3600 })) {
    await prisma.affiliateClick.create({ data: { affiliateId: affiliate.id, path: to } }).catch(() => {});
  }

  const { cookieDays } = await getAffiliateSettings();
  res.cookies.set(REF_COOKIE, normalized, {
    maxAge: cookieDays * 86_400,
    path: "/",
    sameSite: "lax",
    secure: url.protocol === "https:" || process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  return res;
}

/**
 * Affiliate program: referral attribution and commissions.
 *
 * A visit to /r/<code> records a click and sets a first-party cookie naming
 * the affiliate. A store order placed while the cookie is present is
 * attributed to them (never to the buyer themself). When the order is paid,
 * a commission is recorded as PENDING and held for the refund window; the
 * admin approves it afterwards and marks it paid once the money is sent.
 */
import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const REF_COOKIE = "adk_ref";
export const CODE_RE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export const AFFILIATE_SETTING_KEYS = {
  defaultPercent: "affiliate.defaultPercent",
  cookieDays: "affiliate.cookieDays",
  holdDays: "affiliate.holdDays",
} as const;

export interface AffiliateSettings {
  defaultPercent: number;
  cookieDays: number;
  holdDays: number;
}

const DEFAULTS: AffiliateSettings = { defaultPercent: 20, cookieDays: 30, holdDays: 14 };

function int(v: string | undefined, d: number, min: number, max: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : d;
}

export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.values(AFFILIATE_SETTING_KEYS) } } });
  const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    defaultPercent: int(v[AFFILIATE_SETTING_KEYS.defaultPercent], DEFAULTS.defaultPercent, 1, 90),
    cookieDays: int(v[AFFILIATE_SETTING_KEYS.cookieDays], DEFAULTS.cookieDays, 1, 365),
    holdDays: int(v[AFFILIATE_SETTING_KEYS.holdDays], DEFAULTS.holdDays, 0, 120),
  };
}

/** A readable, unique referral code derived from the affiliate's name. */
export async function generateAffiliateCode(name: string): Promise<string> {
  const base =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 20) || "partner";
  const pad = (s: string) => (s.length < 3 ? `${s}-ref` : s);
  let code = pad(base);
  while (await prisma.affiliate.findUnique({ where: { code } })) {
    code = `${pad(base).slice(0, 26)}-${randomBytes(2).toString("hex")}`;
  }
  return code;
}

/** Read the referral cookie from a request's Cookie header. */
export function refCodeFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie") || "";
  const m = header.match(new RegExp(`(?:^|;\\s*)${REF_COOKIE}=([^;]+)`));
  const code = m ? decodeURIComponent(m[1]) : null;
  return code && CODE_RE.test(code) ? code : null;
}

/**
 * The approved affiliate to credit for this request's order, if any. A buyer
 * using their own link earns nothing.
 */
export async function resolveAffiliate(request: Request, buyerEmail: string): Promise<string | null> {
  const code = refCodeFromRequest(request);
  if (!code) return null;
  const a = await prisma.affiliate.findUnique({ where: { code }, select: { id: true, status: true, email: true } });
  if (!a || a.status !== "APPROVED") return null;
  if (a.email.toLowerCase() === buyerEmail.trim().toLowerCase()) return null;
  return a.id;
}

/** Inside the payment transaction: record the commission an order earned. */
export async function recordCommission(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { affiliateId: true, totalCents: true, currency: true, affiliate: { select: { status: true, commissionPercent: true } } },
  });
  if (!order?.affiliateId || !order.affiliate || order.affiliate.status !== "APPROVED") return;
  if (order.totalCents <= 0) return;
  const amountCents = Math.floor((order.totalCents * order.affiliate.commissionPercent) / 100);
  if (amountCents <= 0) return;
  const { holdDays } = await getAffiliateSettings();
  await tx.affiliateCommission.upsert({
    where: { orderId },
    update: {},
    create: {
      affiliateId: order.affiliateId,
      orderId,
      amountCents,
      currency: order.currency,
      holdUntil: new Date(Date.now() + holdDays * 86_400_000),
    },
  });
}

/** A refunded or cancelled order earns nothing (a paid-out one is left for the admin). */
export async function voidCommission(orderId: string): Promise<void> {
  await prisma.affiliateCommission.updateMany({
    where: { orderId, status: { in: ["PENDING", "APPROVED"] } },
    data: { status: "VOID" },
  });
}

/** Only same-site paths may be redirect targets (no open redirect). */
export function safeRedirectPath(to: string | null): string {
  if (!to || !to.startsWith("/") || to.startsWith("//") || to.startsWith("/\\") || to.length > 300) return "/";
  return to;
}

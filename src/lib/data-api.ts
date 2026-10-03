/**
 * Data & Research API: keys, authentication, quotas and rate limits.
 *
 * Keys look like `adk_<32 base64url chars>`. Only a SHA-256 hash is stored;
 * the key itself is shown to its owner once (by email). Each request counts
 * against a monthly quota, enforced with a conditional increment so parallel
 * requests can't overshoot it, and against a per-minute rate limit.
 */
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { ApiKey } from "@prisma/client";
import { prisma } from "./prisma";
import { rateLimitKey } from "./rate-limit";

export const API_SETTING_KEYS = {
  freeQuota: "api.freeQuota",
  proQuota: "api.proQuota",
  proPriceCents: "api.proPriceCents",
  /** The PayPal plan for Pro (public by design: the subscribe button needs it). */
  proPlanId: "api.proPlanId",
} as const;

export interface ApiSettings {
  freeQuota: number;
  proQuota: number;
  freePerMinute: number;
  proPerMinute: number;
  /** Null until the admin sets a price: Pro isn't offered before then. */
  proPriceCents: number | null;
  proPlanId: string | null;
}

export async function getApiSettings(): Promise<ApiSettings> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.values(API_SETTING_KEYS) } } });
  const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const int = (x: string | undefined) => {
    const n = Number.parseInt(x ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  return {
    freeQuota: int(v[API_SETTING_KEYS.freeQuota]) ?? 1000,
    proQuota: int(v[API_SETTING_KEYS.proQuota]) ?? 50000,
    freePerMinute: 30,
    proPerMinute: 300,
    proPriceCents: int(v[API_SETTING_KEYS.proPriceCents]),
    proPlanId: v[API_SETTING_KEYS.proPlanId] || null,
  };
}

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `adk_${randomBytes(24).toString("base64url")}`;
  return { key, prefix: key.slice(0, 12), hash: hashApiKey(key) };
}

export const currentPeriod = (d = new Date()) => d.toISOString().slice(0, 7);

/** The plan in force: a lapsed Pro period falls back to Free. */
export function effectivePlan(k: Pick<ApiKey, "plan" | "currentPeriodEnd">, now = new Date()): "FREE" | "PRO" {
  if (k.plan !== "PRO") return "FREE";
  if (k.currentPeriodEnd && k.currentPeriodEnd.getTime() < now.getTime()) return "FREE";
  return "PRO";
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function apiError(status: number, code: string, message: string, extra: Record<string, string> = {}) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { ...CORS, ...extra } });
}

export function apiOptions() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export interface ApiContext {
  key: ApiKey;
  plan: "FREE" | "PRO";
  quota: number;
  used: number;
}

/**
 * Authenticate and meter one request. Returns the context, or the error
 * response to send (401 bad key, 429 rate/quota).
 */
export async function authenticateApi(request: Request): Promise<ApiContext | NextResponse> {
  const header = request.headers.get("authorization") || "";
  const raw = (header.match(/^Bearer\s+(.+)$/i)?.[1] || request.headers.get("x-api-key") || "").trim();
  if (!/^adk_[A-Za-z0-9_-]{32}$/.test(raw)) {
    return apiError(401, "unauthorized", "Send your API key as `Authorization: Bearer adk_…`. Get one at /developers.");
  }
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(raw) } });
  if (!key || key.status !== "ACTIVE") return apiError(401, "unauthorized", "Unknown or revoked API key.");

  const settings = await getApiSettings();
  const plan = effectivePlan(key);
  const perMinute = plan === "PRO" ? settings.proPerMinute : settings.freePerMinute;
  if (rateLimitKey(`api:${key.id}`, { limit: perMinute, windowSeconds: 60 })) {
    return apiError(429, "rate_limited", `Too many requests: ${perMinute} per minute on the ${plan} plan.`, { "Retry-After": "60" });
  }

  const quota = plan === "PRO" ? settings.proQuota : settings.freeQuota;
  const period = currentPeriod();
  await prisma.apiUsage.upsert({ where: { keyId_period: { keyId: key.id, period } }, update: {}, create: { keyId: key.id, period } });
  // Conditional increment: parallel requests can't push the count past quota.
  const counted = await prisma.apiUsage.updateMany({
    where: { keyId: key.id, period, count: { lt: quota } },
    data: { count: { increment: 1 } },
  });
  if (counted.count === 0) {
    return apiError(429, "quota_exceeded", `Monthly quota of ${quota} requests reached on the ${plan} plan. It resets on the 1st (UTC).`);
  }
  const used = (await prisma.apiUsage.findUnique({ where: { keyId_period: { keyId: key.id, period } } }))?.count ?? quota;

  // Keep lastUsedAt roughly current without a write on every request.
  if (!key.lastUsedAt || Date.now() - key.lastUsedAt.getTime() > 300_000) {
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  }
  return { key, plan, quota, used };
}

/** JSON response with quota headers and permissive CORS (keys are bearer secrets). */
export function apiJson(ctx: ApiContext, body: unknown, init: { status?: number; cache?: string } = {}) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: {
      ...CORS,
      "X-RateLimit-Limit": String(ctx.quota),
      "X-RateLimit-Remaining": String(Math.max(0, ctx.quota - ctx.used)),
      "Cache-Control": init.cache ?? "private, no-store",
    },
  });
}

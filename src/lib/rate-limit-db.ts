import type { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { clientIp, rateLimitKey, tooMany } from "./rate-limit";

/* ── Persistent buckets ────────────────────────────────────────────────────
 * The map above lives in one process and empties on every restart — on a
 * host that sleeps when idle and restarts on each deploy, that is a fresh
 * budget for an attacker several times a day. Buckets for the endpoints that
 * guard credentials and money (login, registration, coupon codes, order
 * lookup) are therefore kept in Postgres, in one atomic upsert per hit. The
 * in-memory limiter still runs first as a cheap pre-filter.
 */

interface Bucket {
  count: number;
  resetAt: Date;
}

/**
 * Count one hit against `key`, starting a new window when the old one has
 * passed. Returns the bucket after the hit; null when the database is
 * unavailable (callers then fall back to the in-memory limiter).
 */
export async function bumpBucket(key: string, windowSeconds: number): Promise<Bucket | null> {
  const resetAt = new Date(Date.now() + windowSeconds * 1000);
  try {
    const rows = await prisma.$queryRaw<Bucket[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN EXCLUDED."resetAt" ELSE "RateLimitBucket"."resetAt" END
      RETURNING "count", "resetAt"`;
    return rows[0] ?? null;
  } catch (err) {
    console.error("rate-limit bucket unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** The live bucket for `key`, or null when none, expired, or the DB is unavailable. */
export async function readBucket(key: string): Promise<Bucket | null> {
  try {
    const rows = await prisma.$queryRaw<Bucket[]>`
      SELECT "count", "resetAt" FROM "RateLimitBucket" WHERE "key" = ${key} AND "resetAt" >= now()`;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function clearBucket(key: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "key" = ${key}`.catch(() => {});
}

/**
 * Rate limit that survives restarts: the in-memory check first, then the
 * database bucket. Keyed by IP + path like `rateLimit`, or by `key`.
 */
export async function persistentRateLimit(
  request: Request,
  config: { limit: number; windowSeconds: number },
  key?: string
): Promise<NextResponse | null> {
  const ip = clientIp(request) || "unknown";
  const k = key ?? `${ip}:${new URL(request.url).pathname}`;
  const fast = rateLimitKey(k, config);
  if (fast) return fast;
  const bucket = await bumpBucket(k, config.windowSeconds);
  if (bucket && bucket.count > config.limit) return tooMany(config.limit, bucket.resetAt.getTime());
  return null;
}

/** Drop buckets whose window has passed; called from the hourly cron. */
export async function pruneBuckets(): Promise<number> {
  try {
    return await prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < now()`;
  } catch {
    return 0;
  }
}

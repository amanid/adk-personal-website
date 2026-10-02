import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
// Hard ceiling so a flood of distinct keys can't grow the map without bound.
const MAX_ENTRIES = 50_000;

/**
 * The connecting client's IP.
 *
 * Production sits behind Cloudflare (Render's edge), which overwrites
 * `cf-connecting-ip` on every request, so it can't be forged. The first entry
 * of X-Forwarded-For can: proxies append to that header rather than replace
 * it, so a client that sends its own XFF chooses the "first" IP and gets a
 * fresh rate-limit bucket per request. Off Cloudflare (local dev) we fall back
 * to the LAST hop, which is the one our own proxy added.
 */
export function clientIp(request: Request): string | null {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean);
  return hops?.length ? hops[hops.length - 1] : null;
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/**
 * In-memory rate limiter keyed by IP.
 * Returns null if within limits, or a 429 NextResponse if exceeded.
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig
): NextResponse | null {
  const ip = clientIp(request) || "unknown";
  return rateLimitKey(`${ip}:${new URL(request.url).pathname}`, config);
}

/** Same limiter, for callers that need a key other than IP + path. */
export function rateLimitKey(key: string, config: RateLimitConfig): NextResponse | null {
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    if (store.size >= MAX_ENTRIES) {
      for (const [k, e] of store) if (now > e.resetAt) store.delete(k);
      // Still full of live entries: drop the oldest insertion.
      if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
    }
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return null;
  }

  entry.count++;
  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

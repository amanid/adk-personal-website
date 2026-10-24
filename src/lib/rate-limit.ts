import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
// Hard ceiling so a flood of distinct keys can't grow the map without bound.
const MAX_ENTRIES = 50_000;

/*
 * Cloudflare's published egress ranges (https://www.cloudflare.com/ips/).
 * `cf-connecting-ip` is only believed when the hop that actually connected to
 * us is one of these: otherwise a client reaching the origin directly could
 * send its own `cf-connecting-ip` and get a fresh rate-limit bucket per request.
 */
// BigInt() calls rather than literals: the TypeScript target predates ES2020.
const ONE = BigInt(1);
const ZERO = BigInt(0);
const ALL_128 = (ONE << BigInt(128)) - ONE;

const CF_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18",
  "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17",
  "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
].map(parseV4Cidr);
const CF_V6 = [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
  "2a06:98c0::/29", "2c0f:f248::/32",
].map(parseV6Cidr);

function parseV4Cidr(cidr: string): [number, number] {
  const [ip, bits] = cidr.split("/");
  const mask = bits === "0" ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return [v4ToInt(ip) & mask, mask];
}

function v4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, o) => ((acc << 8) | Number(o)) >>> 0, 0) >>> 0;
}

function parseV6Cidr(cidr: string): [bigint, bigint] {
  const [ip, bits] = cidr.split("/");
  const mask = ALL_128 ^ ((ONE << BigInt(128 - Number(bits))) - ONE);
  return [(v6ToBig(ip) ?? ZERO) & mask, mask];
}

function v6ToBig(ip: string): bigint | null {
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  if (h.length + t.length > 8) return null;
  const groups = [...h, ...Array(8 - h.length - t.length).fill("0"), ...t];
  let out = ZERO;
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    out = (out << BigInt(16)) | BigInt(parseInt(g, 16));
  }
  return out;
}

/** True when `ip` is inside one of Cloudflare's published ranges. */
export function isCloudflareIp(ip: string): boolean {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const n = v4ToInt(ip);
    return CF_V4.some(([net, mask]) => (n & mask) >>> 0 === net);
  }
  if (ip.includes(":")) {
    const n = v6ToBig(ip.replace(/^\[|\]$/g, ""));
    if (n === null) return false;
    return CF_V6.some(([net, mask]) => (n & mask) === net);
  }
  return false;
}

/**
 * The connecting client's IP.
 *
 * Production sits behind Cloudflare, which sets `cf-connecting-ip`. That header
 * is trusted only when the last X-Forwarded-For hop — the peer our own proxy
 * saw — is a Cloudflare address; a client that reaches the origin directly
 * cannot forge that hop, so it cannot choose its own bucket. The FIRST entry
 * of X-Forwarded-For is never used: proxies append rather than replace, so a
 * client can write whatever it likes there.
 */
export function clientIp(request: Request): string | null {
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean) ?? [];
  const last = hops.length ? hops[hops.length - 1] : null;
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf && last && isCloudflareIp(last)) return cf;
  // Cloudflare is the TCP peer and no proxy added a hop: the header is still
  // genuine when the request carries Cloudflare's own ray id and no XFF chain
  // disagrees — but with no hop to verify, prefer the proxy-supplied value.
  return last ?? (cf && !hops.length ? cf : null);
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

export function tooMany(limit: number, resetAt: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
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
  if (entry.count > config.limit) return tooMany(config.limit, entry.resetAt);
  return null;
}

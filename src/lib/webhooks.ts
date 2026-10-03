/**
 * Outbound webhooks, signed per the Standard Webhooks spec:
 *   webhook-id, webhook-timestamp, webhook-signature: v1,<base64 HMAC-SHA256>
 *   signed content = `${id}.${timestamp}.${body}`, secret = "whsec_" + base64(key)
 * so any Standard Webhooks library (or Zapier/Make with a code step) can
 * verify them.
 *
 * Delivery is SSRF-safe: only https URLs, and every address the hostname
 * resolves to is checked at connect time (so DNS rebinding can't slip a
 * private IP in after validation). Failed deliveries retry with backoff
 * from the cron tick; after the last attempt they are marked FAILED.
 */
import { createHmac, randomBytes, randomUUID } from "crypto";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { isIP } from "node:net";
import { after } from "next/server";
import { Agent, fetch as undiciFetch } from "undici";
import { prisma } from "./prisma";
import { decryptSecret, encryptSecret } from "./email-config";

export const WEBHOOK_EVENTS = {
  "order.paid": "A store, booking or quote payment was confirmed",
  "order.refunded": "A paid order was refunded or reversed",
  "booking.confirmed": "A consulting booking was confirmed",
  "quote.accepted": "A client accepted a quote",
  "subscription.changed": "A research subscription started, renewed, was cancelled or expired",
  "affiliate.applied": "Someone applied to the affiliate program",
  "api.key_created": "A Data API key was issued",
} as const;
export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;

/** Seconds to wait before attempt n+1 (index = attempts so far). */
const BACKOFF = [60, 300, 1800, 7200, 43200, 86400];
export const MAX_ATTEMPTS = BACKOFF.length + 1;

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64")}`;
}

export function signWebhook(secret: string, id: string, timestamp: number, body: string): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  return `v1,${createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64")}`;
}

// ── SSRF guard ───────────────────────────────────────────────────────────────

// Local testing only (a receiver on localhost); ignored in production builds.
const allowPrivateForTests = () => process.env.NODE_ENV !== "production" && process.env.WEBHOOK_ALLOW_PRIVATE === "1";

function isPrivateAddress(address: string): boolean {
  if (allowPrivateForTests()) return false;
  const v = isIP(address);
  if (v === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local, cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224 // multicast + reserved
    );
  }
  if (v === 6) {
    const s = address.toLowerCase();
    if (s === "::" || s === "::1") return true;
    if (s.startsWith("fe8") || s.startsWith("fe9") || s.startsWith("fea") || s.startsWith("feb")) return true; // fe80::/10
    if (s.startsWith("fc") || s.startsWith("fd")) return true; // fc00::/7
    if (s.startsWith("ff")) return true; // multicast
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }
  return true;
}

/** Shape check for an endpoint URL (the address check happens at connect time). */
export function validateWebhookUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return "Not a valid URL.";
  }
  if (u.protocol !== "https:" && !(allowPrivateForTests() && u.protocol === "http:")) return "The URL must use https.";
  if (u.username || u.password) return "Credentials in the URL aren't allowed.";
  if (isIP(u.hostname.replace(/^\[|\]$/g, "")) && isPrivateAddress(u.hostname.replace(/^\[|\]$/g, ""))) {
    return "Private and local addresses aren't allowed.";
  }
  if (!allowPrivateForTests() && /^(localhost|.*\.local|.*\.internal)$/i.test(u.hostname)) {
    return "Private and local addresses aren't allowed.";
  }
  return null;
}

// Every connection resolves through this, so the address is checked at the
// moment of connecting — not only when the endpoint was saved.
const guardedAgent = new Agent({
  connect: {
    lookup(hostname, options, callback) {
      dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return callback(err, "", 0);
        const list = addresses as LookupAddress[];
        const bad = list.find((a) => isPrivateAddress(a.address));
        if (!list.length || bad) {
          return callback(Object.assign(new Error(`Blocked address for ${hostname}`), { code: "EBLOCKED" }), "", 0);
        }
        // undici expects the "all" form when it asked for it.
        if ((options as { all?: boolean }).all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list);
        return callback(null, list[0].address, list[0].family);
      });
    },
  },
  headersTimeout: 10_000,
  bodyTimeout: 10_000,
});

// ── Emitting and delivering ─────────────────────────────────────────────────

/**
 * Queue an event for every active endpoint subscribed to it, and try to
 * deliver straight away (after the response, when called in a request).
 * Never throws: an integration problem must not break a sale.
 */
export async function emitWebhook(type: WebhookEvent, data: Record<string, unknown>): Promise<void> {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({ where: { active: true } });
    const targets = endpoints.filter((e) => e.events.length === 0 || e.events.includes(type));
    if (!targets.length) return;
    const createdAt = new Date().toISOString();
    const ids: string[] = [];
    for (const e of targets) {
      const messageId = `msg_${randomUUID().replace(/-/g, "")}`;
      const d = await prisma.webhookDelivery.create({
        data: { endpointId: e.id, messageId, event: type, payload: { id: messageId, type, created_at: createdAt, data } as object },
      });
      ids.push(d.id);
    }
    const run = () => deliverMany(ids);
    try {
      after(run);
    } catch {
      void run(); // not inside a request (e.g. a script or the cron tick)
    }
  } catch (err) {
    console.error(`Webhook emit (${type}) failed:`, err);
  }
}

async function deliverMany(ids: string[]) {
  for (const id of ids) await deliver(id).catch((e) => console.error("Webhook delivery error:", e));
}

/** One attempt at one delivery; schedules the next attempt on failure. */
export async function deliver(deliveryId: string): Promise<boolean> {
  const d = await prisma.webhookDelivery.findUnique({ where: { id: deliveryId }, include: { endpoint: true } });
  if (!d || d.status !== "PENDING" || !d.endpoint.active) return false;
  // Claim the attempt so a concurrent run can't send the same one twice.
  const claimed = await prisma.webhookDelivery.updateMany({
    where: { id: d.id, status: "PENDING", attempts: d.attempts },
    data: { attempts: { increment: 1 }, nextAttemptAt: new Date(Date.now() + 120_000) },
  });
  if (claimed.count === 0) return false;

  const body = JSON.stringify(d.payload);
  const ts = Math.floor(Date.now() / 1000);
  const secret = decryptSecret(d.endpoint.secretEnc);
  let statusCode: number | null = null;
  let error: string | null = null;
  try {
    const shapeError = validateWebhookUrl(d.endpoint.url);
    if (shapeError) throw new Error(shapeError);
    if (!secret) throw new Error("Endpoint secret can't be decrypted (was AUTH_SECRET changed?)");
    const res = await undiciFetch(d.endpoint.url, {
      method: "POST",
      dispatcher: guardedAgent,
      redirect: "manual", // a redirect could point anywhere
      headers: {
        "content-type": "application/json",
        "user-agent": "konanamanidieudonne.org-webhooks/1.0",
        "webhook-id": d.messageId,
        "webhook-timestamp": String(ts),
        "webhook-signature": signWebhook(secret, d.messageId, ts, body),
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    statusCode = res.status;
    await res.body?.cancel().catch(() => {});
    if (res.status < 200 || res.status >= 300) error = `HTTP ${res.status}`;
  } catch (e) {
    // fetch() wraps the real reason (blocked address, DNS, TLS, timeout) in .cause.
    const cause = (e as { cause?: { message?: string; code?: string } })?.cause;
    error = String(cause?.message || (e as Error)?.message || e).slice(0, 300);
  }

  const attempts = d.attempts + 1;
  if (!error) {
    await prisma.webhookDelivery.update({
      where: { id: d.id },
      data: { status: "SUCCESS", deliveredAt: new Date(), lastStatusCode: statusCode, lastError: null },
    });
    return true;
  }
  const done = attempts >= MAX_ATTEMPTS;
  await prisma.webhookDelivery.update({
    where: { id: d.id },
    data: {
      status: done ? "FAILED" : "PENDING",
      lastStatusCode: statusCode,
      lastError: error,
      nextAttemptAt: new Date(Date.now() + (BACKOFF[attempts - 1] ?? 86400) * 1000),
    },
  });
  return false;
}

/** Retry what's due (called from the cron tick). */
export async function retryDueWebhooks(limit = 50): Promise<{ attempted: number; delivered: number }> {
  const due = await prisma.webhookDelivery.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
    select: { id: true },
  });
  let delivered = 0;
  for (const d of due) if (await deliver(d.id).catch(() => false)) delivered++;
  return { attempted: due.length, delivered };
}

export const encryptWebhookSecret = encryptSecret;
export const decryptWebhookSecret = decryptSecret;

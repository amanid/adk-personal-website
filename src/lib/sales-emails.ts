/**
 * Sales automation emails, run by /api/cron/sales-emails (or "Run now" in
 * admin):
 *   - one reminder for a store order still unpaid after N hours;
 *   - one "you might also like" follow-up N days after a store purchase.
 *
 * Both only consider orders inside a short recent window, so switching this
 * on never emails historical customers, and each email is claimed atomically
 * (sent at most once, even if two runs overlap). Every email carries a
 * one-click opt-out, which is honoured before anything is sent.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { escapeHtml } from "./html";
import { emailShell, emailButton } from "./email-layout";
import { appUrl } from "./orders";
import { formatPrice } from "./utils";
import { effectivePrice } from "./pricing";
import { isMobileMoneyMethod } from "./mobile-money";

export const SALES_SETTING_KEYS = {
  remindersEnabled: "sales.remindersEnabled",
  reminderHours: "sales.reminderHours",
  followUpsEnabled: "sales.followUpsEnabled",
  followUpDays: "sales.followUpDays",
  /** Private: kept out of the public settings API. */
  lastRun: "private.sales.lastRun",
} as const;

export interface SalesSettings {
  remindersEnabled: boolean;
  reminderHours: number;
  followUpsEnabled: boolean;
  followUpDays: number;
}

/** How far past the trigger an order still qualifies (bounds the window). */
const REMINDER_WINDOW_HOURS = 48;
const FOLLOW_UP_WINDOW_DAYS = 3;

export async function getSalesSettings(): Promise<SalesSettings> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.values(SALES_SETTING_KEYS) } } });
  const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const n = (x: string | undefined, d: number, min: number, max: number) => {
    const i = Number.parseInt(x ?? "", 10);
    return Number.isFinite(i) ? Math.min(Math.max(i, min), max) : d;
  };
  return {
    remindersEnabled: v[SALES_SETTING_KEYS.remindersEnabled] !== "false",
    reminderHours: n(v[SALES_SETTING_KEYS.reminderHours], 24, 1, 168),
    followUpsEnabled: v[SALES_SETTING_KEYS.followUpsEnabled] !== "false",
    followUpDays: n(v[SALES_SETTING_KEYS.followUpDays], 7, 1, 60),
  };
}

// ── Opt-out links: an HMAC of the address, so no token table is needed ─────

function optOutSignature(email: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`opt-out:${email.toLowerCase()}`).digest("base64url");
}

export function optOutUrl(email: string): string {
  const e = Buffer.from(email.toLowerCase()).toString("base64url");
  return `${appUrl()}/api/email/opt-out?e=${e}&t=${optOutSignature(email)}`;
}

/** The address an opt-out link is for, or null when the signature is wrong. */
export function verifyOptOut(e: string, t: string): string | null {
  try {
    const email = Buffer.from(e, "base64url").toString("utf8");
    if (!email.includes("@") || email.length > 320) return null;
    const expected = Buffer.from(optOutSignature(email));
    const given = Buffer.from(t);
    return expected.length === given.length && timingSafeEqual(expected, given) ? email.toLowerCase() : null;
  } catch {
    return null;
  }
}

async function optedOut(email: string): Promise<boolean> {
  return !!(await prisma.emailOptOut.findUnique({ where: { email: email.toLowerCase() } }));
}

function footer(email: string): string {
  return `<p style="margin:24px 0 0;font-size:12px;color:#9a968c;">You received this because you placed an order on konanamanidieudonne.org. <a href="${escapeHtml(
    optOutUrl(email)
  )}" style="color:#9a968c;">Don't send me these emails</a>.</p>`;
}

// ── The two jobs ─────────────────────────────────────────────────────────────

async function sendReminders(s: SalesSettings, now: Date): Promise<number> {
  const newest = new Date(now.getTime() - s.reminderHours * 3_600_000);
  const oldest = new Date(newest.getTime() - REMINDER_WINDOW_HOURS * 3_600_000);
  const orders = await prisma.order.findMany({
    where: { kind: "STORE", status: "PENDING", reminderSentAt: null, totalCents: { gt: 0 }, createdAt: { gte: oldest, lte: newest } },
    include: { items: { include: { book: { select: { slug: true } } } } },
    take: 100,
  });
  let sent = 0;
  for (const o of orders) {
    // Claim first: a concurrent run can't send the same reminder twice.
    const claimed = await prisma.order.updateMany({ where: { id: o.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (claimed.count === 0 || (await optedOut(o.email))) continue;

    // A manual payment has instructions on its receipt page; an abandoned
    // PayPal checkout is resumed from the product page.
    const manual = isMobileMoneyMethod(o.paymentMethod) || (o.paymentMethod === "PAYPAL" && !o.paypalOrderId);
    const firstSlug = o.items.find((i) => i.book?.slug)?.book?.slug;
    const link = manual
      ? `${appUrl()}/en/store/receipt/${o.receiptToken}`
      : `${appUrl()}/en/store${firstSlug ? `/${firstSlug}` : ""}`;
    const titles = o.items.map((i) => escapeHtml(i.titleSnapshot)).join(", ");
    const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">Your order is waiting</p>
<p style="margin:0 0 16px;">Hello${o.name ? ` ${escapeHtml(o.name)}` : ""}, your order <strong style="color:#edeae3;">${escapeHtml(
      o.orderNumber
    )}</strong> (${titles}, ${escapeHtml(formatPrice(o.totalCents, o.currency))}) hasn't been completed yet.</p>
<p style="margin:0 0 16px;">${
      manual
        ? "If you've already sent the payment, there's nothing to do — it will be confirmed shortly. Otherwise, the payment details are on your order page."
        : "Your selection is still available whenever you're ready."
    }</p>
${emailButton(escapeHtml(link), manual ? "View payment details" : "Complete your purchase")}
${footer(o.email)}`;
    try {
      await sendEmail(o.email, `Your order ${o.orderNumber} is waiting`, emailShell("Bookstore &middot; Reminder", body));
      sent++;
    } catch (err) {
      console.error("Reminder email failed:", err);
    }
  }
  return sent;
}

async function sendFollowUps(s: SalesSettings, now: Date): Promise<number> {
  const newest = new Date(now.getTime() - s.followUpDays * 86_400_000);
  const oldest = new Date(newest.getTime() - FOLLOW_UP_WINDOW_DAYS * 86_400_000);
  const orders = await prisma.order.findMany({
    where: { kind: "STORE", status: "PAID", followUpSentAt: null, paidAt: { gte: oldest, lte: newest } },
    take: 100,
  });
  let sent = 0;
  for (const o of orders) {
    const claimed = await prisma.order.updateMany({ where: { id: o.id, followUpSentAt: null }, data: { followUpSentAt: now } });
    if (claimed.count === 0 || (await optedOut(o.email))) continue;

    // Everything this address has bought, across all its paid orders.
    const owned = await prisma.orderItem.findMany({
      where: { order: { email: o.email, status: "PAID" }, bookId: { not: null } },
      select: { bookId: true, book: { select: { category: true, tags: true } } },
    });
    const ownedIds = owned.flatMap((i) => (i.bookId ? [i.bookId] : []));
    const categories = [...new Set(owned.flatMap((i) => (i.book?.category ? [i.book.category] : [])))];
    const tags = [...new Set(owned.flatMap((i) => i.book?.tags ?? []))];
    const candidates = await prisma.book.findMany({
      where: {
        status: "PUBLISHED",
        fileId: { not: null },
        id: { notIn: ownedIds },
        currency: o.currency,
        ...(categories.length || tags.length
          ? { OR: [...(categories.length ? [{ category: { in: categories } }] : []), ...(tags.length ? [{ tags: { hasSome: tags } }] : [])] }
          : {}),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
    });
    if (candidates.length === 0) continue; // nothing relevant: say nothing

    const rows = candidates
      .map((b) => {
        const p = effectivePrice(b, now);
        return `<tr><td style="padding:8px 0;border-bottom:1px solid #2e2d2a;"><a href="${escapeHtml(
          `${appUrl()}/en/store/${b.slug}`
        )}" style="color:#edeae3;text-decoration:none;font-weight:bold;">${escapeHtml(b.title)}</a></td><td style="padding:8px 0;border-bottom:1px solid #2e2d2a;text-align:right;color:#ea5536;">${escapeHtml(
          formatPrice(p.priceCents, b.currency)
        )}</td></tr>`;
      })
      .join("");
    const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">Thank you for your purchase</p>
<p style="margin:0 0 16px;">Hello${o.name ? ` ${escapeHtml(o.name)}` : ""}, I hope you're finding it useful. Readers of the same titles also chose:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${rows}</table>
${emailButton(escapeHtml(`${appUrl()}/en/store`), "Browse the store")}
${footer(o.email)}`;
    try {
      await sendEmail(o.email, "You might also like", emailShell("Bookstore", body));
      sent++;
    } catch (err) {
      console.error("Follow-up email failed:", err);
    }
  }
  return sent;
}

export async function runSalesAutomation(now: Date = new Date()) {
  const s = await getSalesSettings();
  const reminders = s.remindersEnabled ? await sendReminders(s, now) : 0;
  const followUps = s.followUpsEnabled ? await sendFollowUps(s, now) : 0;
  const result = { at: now.toISOString(), reminders, followUps };
  await prisma.siteSetting.upsert({
    where: { key: SALES_SETTING_KEYS.lastRun },
    update: { value: JSON.stringify(result) },
    create: { key: SALES_SETTING_KEYS.lastRun, value: JSON.stringify(result) },
  });
  return result;
}

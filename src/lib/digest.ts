/**
 * The monthly brief: one email a month to confirmed newsletter subscribers
 * with what was published in the last month — research, posts, store titles —
 * and exactly one paid link, the advisory session. It is the compounding
 * channel: the list grows from every content page, and the brief turns
 * readers into clients without a campaign.
 *
 * Sent at most once per calendar month (claimed atomically), never when
 * nothing new was published, and only when enabled in admin. Every email
 * carries the subscriber's one-click unsubscribe link, and the site-wide
 * opt-out list is honoured too.
 */
import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { escapeHtml } from "./html";
import { emailShell, emailButton } from "./email-layout";
import { appUrl } from "./orders";
import { formatPriceShort } from "./utils";
import { getAdvisoryOffer } from "./career-data";

export const DIGEST_SETTING_KEYS = {
  enabled: "digest.enabled",
  /** Private: the "YYYY-MM" last sent, and the last run's result. */
  lastSent: "private.digest.lastSent",
  lastRun: "private.digest.lastRun",
} as const;

const WINDOW_DAYS = 31;
const MAX_ITEMS = 8;

export interface DigestItem {
  title: string;
  excerpt: string;
  url: string;
}

export interface DigestContent {
  period: string;
  periodLabel: string;
  publications: DigestItem[];
  posts: DigestItem[];
  products: DigestItem[];
  offer: { label: string; price: string; url: string; freeLabel: string | null; freeUrl: string | null } | null;
}

export const digestPeriod = (d = new Date()) => d.toISOString().slice(0, 7);

const clip = (text: string | null | undefined, max = 220) => {
  const clean = (text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
};

/** Everything published in the last month, newest first, capped per section. */
export async function buildDigest(now = new Date()): Promise<DigestContent> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);
  const base = appUrl();
  const [pubs, posts, books, offer] = await Promise.all([
    prisma.publication.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { slug: true, title: true, abstract: true, year: true, accessLevel: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { slug: true, title: true, excerpt: true },
    }),
    prisma.book.findMany({
      where: { status: "PUBLISHED", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { slug: true, title: true, subtitle: true, priceCents: true, currency: true },
    }),
    getAdvisoryOffer(),
  ]);

  return {
    period: digestPeriod(now),
    periodLabel: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(now),
    publications: pubs.map((p) => ({
      title: p.title,
      excerpt: `${clip(p.abstract)}${p.accessLevel === "GATED" ? " (premium)" : ""}`,
      url: `${base}/en/publications/${p.slug}`,
    })),
    posts: posts.map((p) => ({ title: p.title, excerpt: clip(p.excerpt), url: `${base}/en/blog/${p.slug}` })),
    products: books.map((b) => ({
      title: b.title,
      excerpt: `${clip(b.subtitle, 120)}${b.subtitle ? " · " : ""}${b.priceCents === 0 ? "Free" : formatPriceShort(b.priceCents, b.currency)}`,
      url: `${base}/en/store/${b.slug}`,
    })),
    offer: offer.paid
      ? {
          label: `${offer.paid.durationMinutes}-minute advisory session`,
          price: formatPriceShort(offer.paid.priceCents, offer.paid.currency),
          url: `${base}/en/book?package=${encodeURIComponent(offer.paid.slug)}`,
          freeLabel: offer.free ? `a free ${offer.free.durationMinutes}-minute discovery call` : null,
          freeUrl: offer.free ? `${base}/en/book?package=${encodeURIComponent(offer.free.slug)}` : null,
        }
      : null,
  };
}

export const digestHasContent = (d: DigestContent) => d.publications.length + d.posts.length + d.products.length > 0;

function section(title: string, items: DigestItem[]): string {
  if (!items.length) return "";
  const rows = items
    .map(
      (i) => `<tr><td style="padding:0 0 14px;">
<a href="${escapeHtml(i.url)}" style="color:#edeae3;font-size:15px;font-weight:bold;text-decoration:none;">${escapeHtml(i.title)}</a>
${i.excerpt ? `<p style="margin:4px 0 0;color:#c4bfb4;font-size:13px;line-height:1.5;">${escapeHtml(i.excerpt)}</p>` : ""}
</td></tr>`
    )
    .join("");
  return `<p style="margin:24px 0 10px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#ea5536;font-weight:bold;">${escapeHtml(title)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

/** The email body for one subscriber; `unsubscribeUrl` is theirs alone. */
export function renderDigest(d: DigestContent, unsubscribeUrl: string, name?: string | null): string {
  const offer = d.offer
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #2e2d2a;"><tr><td style="padding-top:22px;">
<p style="margin:0 0 6px;color:#edeae3;font-size:16px;font-weight:bold;">Working on a data or AI problem?</p>
<p style="margin:0 0 14px;color:#c4bfb4;font-size:13px;line-height:1.55;">One ${escapeHtml(d.offer.label)} (${escapeHtml(
        d.offer.price
      )}) is often enough to unblock a model, a pipeline or a decision.${
        d.offer.freeLabel ? ` Or start with <a href="${escapeHtml(d.offer.freeUrl!)}" style="color:#edeae3;">${escapeHtml(d.offer.freeLabel)}</a>.` : ""
      }</p>
${emailButton(escapeHtml(d.offer.url), "Book the session")}
</td></tr></table>`
    : "";
  const body = `
<p style="margin:0 0 6px;color:#edeae3;font-size:20px;font-weight:bold;">The brief · ${escapeHtml(d.periodLabel)}</p>
<p style="margin:0 0 8px;color:#c4bfb4;">Hello${name ? ` ${escapeHtml(name)}` : ""}. Here is what I published this month.</p>
${section("New research", d.publications)}
${section("From the blog", d.posts)}
${section("New in the store", d.products)}
${offer}
<p style="margin:28px 0 0;font-size:12px;color:#9a968c;">You receive this monthly brief because you subscribed on konanamanidieudonne.org. <a href="${escapeHtml(
    unsubscribeUrl
  )}" style="color:#9a968c;">Unsubscribe</a>.</p>`;
  return emailShell("Monthly brief", body);
}

async function setting(key: string): Promise<string | null> {
  return (await prisma.siteSetting.findUnique({ where: { key } }))?.value ?? null;
}

async function putSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function getDigestStatus(now = new Date()) {
  const [enabled, lastSent, lastRun, subscribers] = await Promise.all([
    setting(DIGEST_SETTING_KEYS.enabled),
    setting(DIGEST_SETTING_KEYS.lastSent),
    setting(DIGEST_SETTING_KEYS.lastRun),
    prisma.subscriber.count({ where: { confirmed: true } }),
  ]);
  return {
    enabled: enabled === "true",
    lastSent,
    lastRun: lastRun ? (JSON.parse(lastRun) as Record<string, unknown>) : null,
    period: digestPeriod(now),
    subscribers,
  };
}

export async function setDigestEnabled(enabled: boolean): Promise<void> {
  await putSetting(DIGEST_SETTING_KEYS.enabled, enabled ? "true" : "false");
}

/**
 * Claim this month's send. The row is created once; the conditional update
 * then succeeds for exactly one caller per period, so two overlapping cron
 * runs cannot both send.
 */
async function claimPeriod(period: string): Promise<boolean> {
  await prisma.siteSetting.createMany({ data: [{ key: DIGEST_SETTING_KEYS.lastSent, value: "" }], skipDuplicates: true });
  const r = await prisma.siteSetting.updateMany({
    where: { key: DIGEST_SETTING_KEYS.lastSent, value: { not: period } },
    data: { value: period },
  });
  return r.count === 1;
}

export interface DigestRun {
  at: string;
  period: string;
  sent: number;
  failed: number;
  skipped?: string;
}

/** Send the brief to every confirmed subscriber (callers decide when). */
export async function sendDigest(now = new Date(), opts: { force?: boolean } = {}): Promise<DigestRun> {
  const content = await buildDigest(now);
  const at = now.toISOString();
  if (!digestHasContent(content)) {
    return { at, period: content.period, sent: 0, failed: 0, skipped: "nothing published this month" };
  }
  if (opts.force) {
    await putSetting(DIGEST_SETTING_KEYS.lastSent, content.period);
  } else if (!(await claimPeriod(content.period))) {
    return { at, period: content.period, sent: 0, failed: 0, skipped: "already sent this month" };
  }

  const base = appUrl();
  const subscribers = await prisma.subscriber.findMany({ where: { confirmed: true }, select: { email: true, name: true, token: true } });
  const optedOut = new Set(
    (await prisma.emailOptOut.findMany({ where: { email: { in: subscribers.map((s) => s.email.toLowerCase()) } }, select: { email: true } })).map(
      (o) => o.email
    )
  );
  let sent = 0;
  let failed = 0;
  for (const s of subscribers) {
    if (optedOut.has(s.email.toLowerCase())) continue;
    const unsubscribeUrl = `${base}/api/subscribe?token=${s.token}&action=unsubscribe`;
    try {
      await sendEmail(s.email, `The brief · ${content.periodLabel}`, renderDigest(content, unsubscribeUrl, s.name));
      sent++;
    } catch (err) {
      failed++;
      console.error(`Digest to ${s.email} failed:`, err instanceof Error ? err.message : err);
    }
  }
  const result: DigestRun = { at, period: content.period, sent, failed };
  await putSetting(DIGEST_SETTING_KEYS.lastRun, JSON.stringify(result));
  return result;
}

/** Cron entry point: sends once per month, when enabled and there is something to say. */
export async function runMonthlyDigestIfDue(now = new Date()): Promise<DigestRun | { skipped: string }> {
  const status = await getDigestStatus(now);
  if (!status.enabled) return { skipped: "disabled" };
  if (status.lastSent === status.period) return { skipped: "already sent this month" };
  return sendDigest(now);
}

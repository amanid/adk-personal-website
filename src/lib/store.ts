/**
 * Bookstore domain helpers: server-side pricing (integrity), download grants,
 * order-number generation and money formatting.
 *
 * Security principle: prices and totals are ALWAYS recomputed here from the
 * database. Client-supplied amounts are never trusted.
 */
import { randomBytes } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import { applyCoupon } from "./coupon";
import { effectivePrice, parseCartId, payWhatYouWantMax } from "./pricing";

export const STORE_CURRENCY = "USD";
export const DOWNLOAD_EXPIRY_DAYS = 7;
export const DOWNLOAD_MAX_PER_ITEM = 5;

/** A validated, DB-sourced line item ready to persist as an OrderItem. */
export interface PricedItem {
  /** Set for a single product line. */
  bookId: string | null;
  /** Set for a bundle line (its products are granted on payment). */
  bundleId: string | null;
  title: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface PricedCart {
  items: PricedItem[];
  subtotalCents: number;
  totalCents: number;
  currency: string;
}

export interface CartInput {
  /** A product id, or a bundle as `bundle:<id>` (see lib/pricing). */
  bookId: string;
  quantity: number;
  /** Pay-what-you-want only: the buyer's chosen unit amount. */
  amountCents?: number;
}

export interface PricedOrder {
  items: PricedItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  couponId: string | null;
  couponCode: string | null;
}

/**
 * Price a cart and optionally apply a coupon — the single source of truth used
 * by every checkout route. Throws (with a buyer-safe message) on an invalid
 * cart or coupon.
 */
export async function priceOrder(
  items: CartInput[],
  couponCode?: string | null
): Promise<PricedOrder> {
  const priced = await priceCart(items);
  let discountCents = 0;
  let couponId: string | null = null;
  let appliedCode: string | null = null;

  if (couponCode && couponCode.trim()) {
    const applied = await applyCoupon(couponCode, priced.subtotalCents, priced.currency);
    discountCents = applied.discountCents;
    couponId = applied.couponId;
    appliedCode = applied.code;
  }

  return {
    items: priced.items,
    subtotalCents: priced.subtotalCents,
    discountCents,
    totalCents: Math.max(0, priced.subtotalCents - discountCents),
    currency: priced.currency,
    couponId,
    couponCode: appliedCode,
  };
}

/**
 * Recompute cart pricing from the database. Only PUBLISHED products with a
 * downloadable file (and PUBLISHED bundles made only of such products) are
 * purchasable. Launch offers and pay-what-you-want are applied here, and only
 * here. Throws a buyer-safe message on any invalid line.
 */
export async function priceCart(items: CartInput[], now: Date = new Date()): Promise<PricedCart> {
  if (!items.length) throw new Error("Cart is empty");

  // Merge duplicate lines, summing quantities (the last chosen amount wins).
  const merged = new Map<string, { quantity: number; amountCents?: number }>();
  for (const { bookId, quantity, amountCents } of items) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("Invalid quantity");
    }
    const prev = merged.get(bookId);
    merged.set(bookId, { quantity: (prev?.quantity || 0) + quantity, amountCents: amountCents ?? prev?.amountCents });
  }

  const bookIds: string[] = [];
  const bundleIds: string[] = [];
  for (const id of merged.keys()) {
    const ref = parseCartId(id);
    if ("bundleId" in ref) bundleIds.push(ref.bundleId);
    else bookIds.push(ref.bookId);
  }

  const [books, bundles] = await Promise.all([
    bookIds.length
      ? prisma.book.findMany({
          where: { id: { in: bookIds }, status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            priceCents: true,
            fileId: true,
            currency: true,
            salePriceCents: true,
            saleStartsAt: true,
            saleEndsAt: true,
            payWhatYouWant: true,
          },
        })
      : [],
    bundleIds.length
      ? prisma.bundle.findMany({
          where: { id: { in: bundleIds }, status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            priceCents: true,
            currency: true,
            items: { select: { book: { select: { status: true, fileId: true } } } },
          },
        })
      : [],
  ]);
  const bookById = new Map(books.map((b) => [b.id, b]));
  const bundleById = new Map(bundles.map((b) => [b.id, b]));

  const priced: PricedItem[] = [];
  let currency: string | null = null;
  const sameCurrency = (c: string) => {
    // All items in an order must share one currency (single, coherent total).
    if (currency === null) currency = c;
    else if (currency !== c) {
      throw new Error("Your cart mixes currencies. Please order items of one currency at a time.");
    }
  };

  for (const [id, line] of merged) {
    const ref = parseCartId(id);
    if ("bundleId" in ref) {
      const bundle = bundleById.get(ref.bundleId);
      if (!bundle || bundle.items.length === 0) throw new Error("One or more bundles are unavailable");
      if (bundle.items.some((i) => i.book.status !== "PUBLISHED" || !i.book.fileId)) {
        throw new Error(`"${bundle.title}" is not available right now`);
      }
      sameCurrency(bundle.currency);
      priced.push({
        bookId: null,
        bundleId: bundle.id,
        title: bundle.title,
        unitPriceCents: bundle.priceCents,
        quantity: line.quantity,
        lineTotalCents: bundle.priceCents * line.quantity,
      });
      continue;
    }

    const book = bookById.get(ref.bookId);
    if (!book) throw new Error("One or more items are unavailable");
    if (!book.fileId) throw new Error(`"${book.title}" is not available for download yet`);
    if (book.priceCents < 0) throw new Error("Invalid price");
    sameCurrency(book.currency);

    const price = effectivePrice(book, now);
    let unit = price.priceCents;
    if (price.payWhatYouWant && line.amountCents !== undefined) {
      if (!Number.isInteger(line.amountCents) || line.amountCents < price.priceCents) {
        throw new Error(`The minimum for "${book.title}" is ${formatUsd(price.priceCents, book.currency)}`);
      }
      if (line.amountCents > payWhatYouWantMax(price.priceCents)) throw new Error("That amount is too high");
      unit = line.amountCents;
    }
    priced.push({
      bookId: book.id,
      bundleId: null,
      title: book.title,
      unitPriceCents: unit,
      quantity: line.quantity,
      lineTotalCents: unit * line.quantity,
    });
  }

  const subtotalCents = priced.reduce((sum, i) => sum + i.lineTotalCents, 0);

  return {
    items: priced,
    subtotalCents,
    totalCents: subtotalCents, // no tax/shipping for digital goods
    currency: currency ?? STORE_CURRENCY,
  };
}

/** Generate a human-friendly, unguessable order number, e.g. BK-2026-8F3A2C. */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `BK-${year}-${rand}`;
}

/**
 * Cryptographically strong, URL-safe token (256 bits) for bearer capabilities
 * such as download and receipt links. Prefer this over Prisma's `cuid()` default,
 * which is time-ordered and only partially random.
 */
export function secureToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Create one download grant per purchased book for a PAID order.
 * Idempotent: if grants already exist for the order, returns the existing ones.
 * Accepts a transaction client so it can run inside the capture transaction.
 */
export async function createDownloadGrants(
  db: Prisma.TransactionClient | PrismaClient,
  orderId: string
): Promise<void> {
  const existing = await db.downloadGrant.count({ where: { orderId } });
  if (existing > 0) return;

  // Product lines carry one download each; a bundle line carries one per
  // product in it. Booking and quote lines carry none.
  const lines = await db.orderItem.findMany({
    where: { orderId, OR: [{ bookId: { not: null } }, { bundleId: { not: null } }] },
    select: { bookId: true, bundle: { select: { items: { select: { bookId: true } } } } },
  });
  const ids = new Set<string>();
  for (const l of lines) {
    if (l.bookId) ids.add(l.bookId);
    for (const i of l.bundle?.items ?? []) ids.add(i.bookId);
  }
  const items = [...ids].map((bookId) => ({ bookId }));
  if (items.length === 0) return;

  const expiresAt = new Date(Date.now() + DOWNLOAD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.downloadGrant.createMany({
    data: items.map((i) => ({
      orderId,
      bookId: i.bookId,
      token: secureToken(),
      maxDownloads: DOWNLOAD_MAX_PER_ITEM,
      expiresAt,
    })),
    skipDuplicates: true,
  });
}

/** Format integer cents as a USD amount, e.g. 1999 -> "$19.99". */
export function formatUsd(cents: number, currency: string = STORE_CURRENCY): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

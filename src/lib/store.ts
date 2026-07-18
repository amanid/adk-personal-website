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

export const STORE_CURRENCY = "USD";
export const DOWNLOAD_EXPIRY_DAYS = 7;
export const DOWNLOAD_MAX_PER_ITEM = 5;

/** A validated, DB-sourced line item ready to persist as an OrderItem. */
export interface PricedItem {
  bookId: string;
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
  bookId: string;
  quantity: number;
}

/**
 * Recompute cart pricing from the database. Only PUBLISHED books that have an
 * attached downloadable file are purchasable. Throws on any invalid item.
 */
export async function priceCart(items: CartInput[]): Promise<PricedCart> {
  if (!items.length) throw new Error("Cart is empty");

  // Merge duplicate bookIds, summing quantities.
  const merged = new Map<string, number>();
  for (const { bookId, quantity } of items) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("Invalid quantity");
    }
    merged.set(bookId, (merged.get(bookId) || 0) + quantity);
  }

  const ids = [...merged.keys()];
  const books = await prisma.book.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    select: { id: true, title: true, priceCents: true, fileId: true },
  });

  const byId = new Map(books.map((b) => [b.id, b]));

  const priced: PricedItem[] = [];
  for (const [bookId, quantity] of merged) {
    const book = byId.get(bookId);
    if (!book) throw new Error("One or more books are unavailable");
    if (!book.fileId) throw new Error(`"${book.title}" is not available for download yet`);
    if (book.priceCents < 0) throw new Error("Invalid price");

    priced.push({
      bookId: book.id,
      title: book.title,
      unitPriceCents: book.priceCents,
      quantity,
      lineTotalCents: book.priceCents * quantity,
    });
  }

  const subtotalCents = priced.reduce((sum, i) => sum + i.lineTotalCents, 0);

  return {
    items: priced,
    subtotalCents,
    totalCents: subtotalCents, // no tax/shipping for digital goods
    currency: STORE_CURRENCY,
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

  const items = await db.orderItem.findMany({
    where: { orderId },
    select: { bookId: true },
  });

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

/**
 * Price rules shared by the server (authoritative, at checkout) and the
 * browser (display only). Pure functions, no imports, safe on both sides.
 */

export interface PriceRuleInput {
  priceCents: number;
  salePriceCents?: number | null;
  saleStartsAt?: Date | string | null;
  saleEndsAt?: Date | string | null;
  payWhatYouWant?: boolean;
}

export interface EffectivePrice {
  /** What one unit costs now (the minimum, for pay-what-you-want). */
  priceCents: number;
  /** The regular price, when a sale is running. */
  regularCents: number | null;
  onSale: boolean;
  saleEndsAt: Date | null;
  payWhatYouWant: boolean;
}

const toDate = (d: Date | string | null | undefined) => (d ? new Date(d) : null);

/** The price in force at `now`, applying a launch offer when its window is open. */
export function effectivePrice(p: PriceRuleInput, now: Date = new Date()): EffectivePrice {
  const starts = toDate(p.saleStartsAt);
  const ends = toDate(p.saleEndsAt);
  const t = now.getTime();
  const onSale =
    p.salePriceCents != null &&
    p.salePriceCents >= 0 &&
    p.salePriceCents < p.priceCents &&
    (!starts || starts.getTime() <= t) &&
    (!ends || ends.getTime() > t);
  return {
    priceCents: onSale ? (p.salePriceCents as number) : p.priceCents,
    regularCents: onSale ? p.priceCents : null,
    onSale,
    saleEndsAt: onSale ? ends : null,
    payWhatYouWant: !!p.payWhatYouWant,
  };
}

/** The price fields a product card needs. */
export function cardPrice(p: PriceRuleInput, now: Date = new Date()) {
  const e = effectivePrice(p, now);
  return { priceCents: e.priceCents, regularCents: e.regularCents, payWhatYouWant: e.payWhatYouWant };
}

/** Upper bound for a pay-what-you-want amount: a guard against typos. */
export function payWhatYouWantMax(minCents: number): number {
  return Math.max(minCents * 100, 1_000_000); // ×100 the minimum, at least 10,000.00
}

// A bundle travels through the cart as a line whose id carries this prefix,
// so the cart needs no second kind of line.
const BUNDLE_PREFIX = "bundle:";
export const bundleCartId = (bundleId: string) => `${BUNDLE_PREFIX}${bundleId}`;
export function parseCartId(id: string): { bookId: string } | { bundleId: string } {
  return id.startsWith(BUNDLE_PREFIX) ? { bundleId: id.slice(BUNDLE_PREFIX.length) } : { bookId: id };
}

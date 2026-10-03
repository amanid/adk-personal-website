/**
 * Research subscription tiers and prices — the single source for both the
 * subscribe page and the PayPal billing plans created from it. Client-safe.
 */
export type TierId = "DOCUMENT_ACCESS" | "DATA_ACCESS" | "FULL_ACCESS";
export type BillingInterval = "MONTH" | "YEAR";

export const SUBSCRIPTION_CURRENCY = "USD";

/** Prices in cents. */
export const TIER_PRICES: Record<TierId, Record<BillingInterval, number>> = {
  DOCUMENT_ACCESS: { MONTH: 999, YEAR: 9900 },
  DATA_ACCESS: { MONTH: 1499, YEAR: 14900 },
  FULL_ACCESS: { MONTH: 1999, YEAR: 19900 },
};

export const TIER_LABELS: Record<TierId, string> = {
  DOCUMENT_ACCESS: "Document Access",
  DATA_ACCESS: "Data Access",
  FULL_ACCESS: "Full Access",
};

/**
 * Whether a subscription grants access now. A PayPal subscription cancelled
 * by the subscriber keeps access until the end of the period already paid.
 */
export function subscriptionGrantsAccess(
  s: { status: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: Date | string | null } | null,
  now: Date = new Date()
): boolean {
  if (!s) return false;
  if (s.status === "ACTIVE") return true;
  return (
    s.status === "CANCELLED" &&
    s.cancelAtPeriodEnd &&
    !!s.currentPeriodEnd &&
    new Date(s.currentPeriodEnd).getTime() > now.getTime()
  );
}

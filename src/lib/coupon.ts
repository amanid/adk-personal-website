import { prisma } from "./prisma";

/** Normalize a coupon code: uppercase, no spaces. */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export interface AppliedCoupon {
  couponId: string;
  code: string;
  discountCents: number;
}

/**
 * Validate a coupon against a cart subtotal + currency and compute the discount.
 * Returns the applied coupon, or throws an Error whose message is safe to show
 * the buyer. Callers must recompute the subtotal from the DB (never trust the
 * client) before calling this.
 */
export async function applyCoupon(
  rawCode: string,
  subtotalCents: number,
  currency: string
): Promise<AppliedCoupon> {
  const code = normalizeCouponCode(rawCode || "");
  if (!code) throw new Error("Enter a coupon code.");

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) throw new Error("This coupon code is not valid.");
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new Error("This coupon has expired.");
  }
  if (coupon.maxRedemptions != null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    throw new Error("This coupon has reached its usage limit.");
  }
  // Currency restriction (always set for FIXED; optional for PERCENT).
  if (coupon.currency && coupon.currency !== currency) {
    throw new Error(`This coupon only applies to ${coupon.currency} orders.`);
  }
  if (subtotalCents < coupon.minSubtotalCents) {
    throw new Error("Your order doesn't meet this coupon's minimum.");
  }

  const discount =
    coupon.type === "PERCENT"
      ? Math.round((subtotalCents * (coupon.percentOff ?? 0)) / 100)
      : coupon.amountOffCents ?? 0;

  let discountCents = discount;

  // Never discount below zero or above the subtotal.
  discountCents = Math.max(0, Math.min(discountCents, subtotalCents));

  return { couponId: coupon.id, code, discountCents };
}

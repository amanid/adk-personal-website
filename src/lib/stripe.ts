import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

// Lazy accessor — use `stripe` in API routes
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const SUBSCRIPTION_PRICES = {
  DOCUMENT_ACCESS: {
    monthly: process.env.STRIPE_PRICE_DOCUMENT_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_DOCUMENT_YEARLY || "",
  },
  DATA_ACCESS: {
    monthly: process.env.STRIPE_PRICE_DATA_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_DATA_YEARLY || "",
  },
  FULL_ACCESS: {
    monthly: process.env.STRIPE_PRICE_FULL_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_FULL_YEARLY || "",
  },
} as const;

export const TIER_DISPLAY = {
  DOCUMENT_ACCESS: {
    monthlyPrice: 9.99,
    yearlyPrice: 99,
  },
  DATA_ACCESS: {
    monthlyPrice: 14.99,
    yearlyPrice: 149,
  },
  FULL_ACCESS: {
    monthlyPrice: 19.99,
    yearlyPrice: 199,
  },
} as const;

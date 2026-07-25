/**
 * Mobile-money configuration (client-safe — no server-only imports).
 *
 * Payments to these providers are made directly to the merchant's number and
 * confirmed manually by an admin (no automated verification API), so orders
 * paid this way stay PENDING until the admin marks them paid.
 */
export const MOBILE_MONEY_NUMBER =
  process.env.NEXT_PUBLIC_MOBILE_MONEY_NUMBER || "+225 07 47 88 22 35";

export const MOBILE_MONEY_PROVIDERS = [
  { id: "WAVE", label: "Wave", color: "#1DC8FF" },
  { id: "DJAMO", label: "Djamo", color: "#6C4BF4" },
  { id: "ORANGE_MONEY", label: "Orange Money", color: "#FF7900" },
] as const;

export type MobileMoneyProviderId = (typeof MOBILE_MONEY_PROVIDERS)[number]["id"];

export const MOBILE_MONEY_PROVIDER_IDS = MOBILE_MONEY_PROVIDERS.map((p) => p.id);

export function mobileMoneyLabel(id: string): string {
  return MOBILE_MONEY_PROVIDERS.find((p) => p.id === id)?.label || id;
}

/** True for the mobile-money providers (excludes PayPal and Free). */
export function isMobileMoneyMethod(method: string): boolean {
  return MOBILE_MONEY_PROVIDER_IDS.includes(method as MobileMoneyProviderId);
}

/** Human label for any PaymentMethod value. */
export function paymentMethodLabel(method: string): string {
  if (method === "PAYPAL") return "PayPal";
  if (method === "FREE") return "Free";
  return mobileMoneyLabel(method);
}

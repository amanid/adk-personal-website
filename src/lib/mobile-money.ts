/**
 * Mobile-money configuration (client-safe — no server-only imports).
 *
 * Payments to these providers are made directly to the merchant's number and
 * confirmed manually by an admin (no automated verification API), so orders
 * paid this way stay PENDING until the admin marks them paid.
 */
export const MOBILE_MONEY_NUMBER =
  process.env.NEXT_PUBLIC_MOBILE_MONEY_NUMBER || "+225 07 47 88 22 35";

// WhatsApp number buyers send proof of payment to (digits only for wa.me links).
export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2250747882235"
).replace(/\D/g, "");

/** Build a wa.me link, optionally pre-filling a message. */
export function whatsappLink(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

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

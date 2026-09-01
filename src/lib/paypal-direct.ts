/**
 * "PayPal to PayPal" — direct transfer configuration (client-safe).
 *
 * This is the no-API path: the buyer sends the amount straight to the
 * merchant's PayPal account (via a PayPal.me link or the account's email
 * address) and the order stays PENDING until an admin confirms it, exactly like
 * the mobile-money flow.
 *
 * It requires no REST credentials and no PayPal Business account, so it works
 * with an ordinary personal account. When PayPal REST credentials *are*
 * configured the storefront prefers the automatic Orders v2 flow instead, which
 * unlocks downloads instantly.
 */
import { minorToMajor } from "./currency";

/**
 * PayPal.me handle — "amanidd399" for paypal.me/amanidd399. A full URL is
 * accepted too and reduced to the handle.
 *
 * Defaults to the merchant's own handle (mirroring MOBILE_MONEY_NUMBER) so the
 * direct flow works without any environment configuration; the env var only
 * needs setting to point payments somewhere else.
 */
export const PAYPAL_ME_HANDLE = (
  process.env.NEXT_PUBLIC_PAYPAL_ME || "amanidd399"
).replace(/^.*paypal\.me\//i, "");

/** The PayPal account address buyers send to. */
export const PAYPAL_RECEIVE_EMAIL =
  process.env.NEXT_PUBLIC_PAYPAL_EMAIL || "amanidieudonnekonan@gmail.com";

/** True when the direct transfer flow can be offered at all. */
export function isPaypalDirectConfigured(): boolean {
  return Boolean(PAYPAL_ME_HANDLE || PAYPAL_RECEIVE_EMAIL);
}

/** True when the automatic (Orders v2) flow is available. */
export function isPaypalApiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
}

/**
 * A PayPal.me deep link pre-filled with the amount, e.g.
 * https://www.paypal.me/amanikonan/25USD — returns null without a handle.
 *
 * PayPal.me expects the *major* amount, so minor units are converted using the
 * currency's own precision (XOF has none, USD has two).
 */
export function paypalMeLink(totalMinor: number, currency: string): string | null {
  if (!PAYPAL_ME_HANDLE) return null;
  const major = minorToMajor(totalMinor, currency);
  // PayPal.me rejects trailing zeros in some locales; keep it minimal but exact.
  const amount = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `https://www.paypal.me/${encodeURIComponent(
    PAYPAL_ME_HANDLE
  )}/${amount}${currency.toUpperCase()}`;
}

/**
 * Multi-currency money helpers (client-safe).
 *
 * Prices are stored as integer MINOR units of their currency (like Stripe):
 *  - USD/EUR/GBP/EGP/CAD… have 2 decimals, so minor = amount × 100.
 *  - XOF (CFA franc) has 0 decimals, so minor = amount.
 * Intl handles per-currency formatting/decimals; we only need to scale by the
 * correct power of ten when converting to/from the amount an admin types.
 */

export interface CurrencyMeta {
  code: string;
  label: string;
}

// Default first (USD). Includes the currencies the site is likely to price in.
export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "XOF", label: "CFA Franc BCEAO (XOF)" },
  { code: "EGP", label: "Egyptian Pound (EGP)" },
  { code: "NGN", label: "Nigerian Naira (NGN)" },
  { code: "GHS", label: "Ghanaian Cedi (GHS)" },
  { code: "MAD", label: "Moroccan Dirham (MAD)" },
  { code: "ZAR", label: "South African Rand (ZAR)" },
  { code: "KES", label: "Kenyan Shilling (KES)" },
];

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

// Currencies PayPal can settle. Others (XOF, EGP, NGN, …) are mobile-money only.
export const PAYPAL_CURRENCIES = new Set([
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "HKD",
  "SGD",
  "NZD",
  "MXN",
  "BRL",
  "ZAR",
]);

export function isPaypalCurrency(currency: string): boolean {
  return PAYPAL_CURRENCIES.has(currency.toUpperCase());
}

/** Number of decimal places a currency uses (2 for USD, 0 for XOF/JPY). */
export function currencyDecimals(currency: string): number {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** Convert stored minor units to the human amount (5000 USD → 50; 30000 XOF → 30000). */
export function minorToMajor(minor: number, currency: string): number {
  return minor / Math.pow(10, currencyDecimals(currency));
}

/** Convert a typed amount to stored minor units (50 USD → 5000; 30000 XOF → 30000). */
export function majorToMinor(major: number, currency: string): number {
  return Math.round(major * Math.pow(10, currencyDecimals(currency)));
}

/** Format stored minor units as localized currency (e.g. 5000,"USD" → "$50.00"). */
export function formatMoney(minor: number, currency: string = "USD"): string {
  const code = currency && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : "USD";
  const amount = Number.isFinite(minor) ? minorToMajor(minor, code) : 0;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

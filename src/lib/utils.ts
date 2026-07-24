import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatMoney } from "./currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale: string = "en") {
  return new Date(date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Serialize a JSON-LD object for injection into a <script> tag, escaping "<"
 * so a "</script>" sequence in any data field can't break out of the tag.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Client-safe money formatter for integer minor units. Currency-aware: uses the
 * right number of decimals per currency (e.g. XOF has none). e.g. 1999,"USD" ->
 * "$19.99"; 30000,"XOF" -> "CFA 30,000".
 */
export function formatPrice(minor: number, currency: string = "USD"): string {
  return formatMoney(minor, currency);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

/**
 * Human file size for download listings, e.g. 5_452_595 -> "5.2 MB".
 * Uses binary units (what an OS reports) and drops the decimal above 100 units,
 * where the extra precision is noise.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const decimals = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unit]}`;
}

/**
 * "application/pdf" → "PDF". Returns null for anything we can't name.
 *
 * Lives here rather than beside the card component so both the server-rendered
 * book page and the client card can use it — a "use client" module cannot
 * export a plain function to the server.
 */
export function fileFormatLabel(mimeType?: string | null): string | null {
  if (!mimeType) return null;
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("epub")) return "EPUB";
  return null;
}

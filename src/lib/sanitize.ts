/**
 * Sanitize user input to prevent XSS in stored/reflected content.
 * Strips HTML tags and trims whitespace.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map((v) =>
        typeof v === "string" ? sanitizeInput(v) : v
      );
    }
  }
  return result;
}

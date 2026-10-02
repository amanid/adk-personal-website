/**
 * Escape text for interpolation into HTML (element content or a quoted
 * attribute). Every value that reaches an email template from a request, a
 * buyer or the database goes through this.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

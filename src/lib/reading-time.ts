export function estimateReadingTime(text: string): number {
  // Strip HTML tags
  const clean = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const wordCount = clean.split(/\s+/).length;
  const wpm = 200; // Average reading speed
  return Math.max(1, Math.ceil(wordCount / wpm));
}

export function formatReadingTime(minutes: number, locale: string = "en"): string {
  if (locale === "fr") {
    return `${minutes} min de lecture`;
  }
  return `${minutes} min read`;
}

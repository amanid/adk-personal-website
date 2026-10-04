/**
 * Language of a document's text, from how often each language's most common
 * function words occur. Deterministic, and it answers "unknown" rather than
 * guess when the text is short or the signal is mixed.
 */

const STOPWORDS: Record<string, string[]> = {
  English: ["the", "and", "of", "to", "in", "is", "that", "for", "with", "as", "are", "this", "by", "on", "from", "which", "be", "its", "has", "have", "were", "was", "their", "more"],
  French: ["le", "la", "les", "et", "des", "du", "une", "est", "dans", "pour", "que", "qui", "sur", "par", "au", "aux", "plus", "sont", "ces", "cette", "leur", "ont", "été", "avec"],
  Spanish: ["el", "los", "las", "y", "del", "una", "es", "en", "para", "que", "por", "con", "se", "su", "sus", "más", "como", "este", "esta", "son", "fue", "entre"],
  Portuguese: ["os", "as", "e", "do", "da", "dos", "das", "uma", "é", "em", "para", "que", "com", "não", "mais", "como", "seu", "sua", "são", "foi", "pelo", "pela"],
  German: ["der", "die", "das", "und", "des", "den", "ein", "eine", "ist", "im", "für", "mit", "von", "auf", "nicht", "sich", "dem", "zu", "auch", "wird", "sind"],
  Italian: ["il", "gli", "e", "della", "delle", "degli", "una", "è", "nel", "per", "che", "con", "non", "più", "come", "sono", "alla", "dei", "questo", "anche"],
};

export const LANGUAGE_CODES: Record<string, string> = {
  en: "English", fr: "French", es: "Spanish", pt: "Portuguese", de: "German", it: "Italian", ar: "Arabic", sw: "Swahili", zh: "Chinese",
};

/** "en", "EN-US", "fr_FR" → "English", "French"; unknown codes → null. */
export function languageFromCode(code?: string | null): string | null {
  const base = (code || "").trim().toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_CODES[base] ?? null;
}

export function detectLanguage(text: string): { language: string; confidence: "high" } | null {
  const sample = text.slice(0, 60000);
  const letters = sample.match(/\p{L}/gu) ?? [];
  if (letters.length < 200) return null;
  const arabic = (sample.match(/\p{Script=Arabic}/gu) ?? []).length;
  if (arabic / letters.length > 0.3) return { language: "Arabic", confidence: "high" };

  const words = sample.toLowerCase().match(/\p{L}+/gu) ?? [];
  const counts = Object.entries(STOPWORDS).map(([lang, list]) => {
    const set = new Set(list);
    return { lang, hits: words.filter((w) => set.has(w)).length };
  });
  counts.sort((a, b) => b.hits - a.hits);
  const [top, second] = counts;
  // Clear winner only: enough evidence, and well ahead of the runner-up.
  if (top.hits >= 25 && top.hits >= second.hits * 2) return { language: top.lang, confidence: "high" };
  return null;
}

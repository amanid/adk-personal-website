/**
 * Checks that hold AI-drafted catalogue copy to its source document.
 *
 * A language model can state a figure, name an institution or quote a
 * passage that the document doesn't contain. Each check here is mechanical:
 * a sentence survives only if every figure in it and every named
 * organisation or acronym appears in the source, and a key insight survives
 * only if its supporting quotation is really in the text. What fails is
 * removed and reported, never repaired.
 */

/** Fold text for matching: accents, case, quotes, dashes, spacing. */
export function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ­]/g, "")
    .toLowerCase()
    .replace(/[‘’‚‛′`´]/g, "'")
    .replace(/[“”„‟″«»]/g, '"')
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/[\s  -​ ]+/g, " ")
    .trim();
}

/** Folded with all spacing removed: survives PDF text split mid-word ("Africa ’ s"). */
export const squash = (s: string) => fold(s).replace(/[^\p{L}\p{N}%$€£]/gu, "");

/**
 * Every figure written in the text, canonicalised: "1,500" and "1 500" are
 * 1500, "62,4" and "62.4" are 62.4. A separator followed by exactly three
 * digits is a thousands separator; any other is a decimal point.
 */
export function figures(text: string): string[] {
  const out: string[] = [];
  const re = /\d+(?:[,.   ]\d+)*/g;
  for (const m of fold(text).matchAll(re)) {
    let token = m[0];
    // Split runs that are really two numbers ("2000 2025" in a range written with a space).
    const parts = token.split(/[   ]/);
    if (parts.length > 1 && !parts.slice(1).every((p) => /^\d{3}$/.test(p))) {
      for (const p of parts) out.push(...figures(p));
      continue;
    }
    token = token.replace(/[   ]/g, "");
    const groups = token.split(/[,.]/);
    let value: string;
    if (groups.length === 1) value = token;
    else {
      const last = groups[groups.length - 1];
      const allThousands = groups.slice(1).every((g) => g.length === 3);
      if (allThousands && groups.length > 2) value = groups.join("");
      else if (allThousands && last.length === 3 && groups[0].length <= 3) value = groups.join("");
      else value = groups.slice(0, -1).join("") + "." + last;
    }
    value = value.includes(".") ? value.replace(/\.?0+$/, "") : value.replace(/^0+(?=\d)/, "");
    out.push(value);
  }
  return out;
}

/** Acronyms (IMF, AfDB, GDP) and multi-word proper names (World Bank). */
export function namedThings(sentence: string): string[] {
  const words = sentence.split(/\s+/);
  const found: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 2) found.push(run.join(" "));
    run = [];
  };
  words.forEach((raw, i) => {
    const w = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    // Acronyms: short, starting with a capital, two or more capitals (IMF, AfDB, GDP).
    if (/^\p{Lu}\p{L}{1,5}$/u.test(w) && (w.match(/\p{Lu}/gu) ?? []).length >= 2) found.push(w);
    // Sentence-initial capitals don't make a name; nor do small joining words.
    const capital = /^\p{Lu}\p{Ll}+/u.test(w) && i > 0;
    if (capital) run.push(w);
    else if (run.length && /^(?:of|for|de|des|du|la|le|pour)$/.test(w) && /^\p{Lu}/u.test((words[i + 1] || "").replace(/^[^\p{L}]+/u, ""))) run.push(w);
    else flush();
    if (/[.,;:!?)]$/.test(raw)) flush();
  });
  flush();
  return [...new Set(found)];
}

const HYPE = /\b(?:best-?sell(?:ing|er)|award-winning|acclaimed|renowned|groundbreaking|ground-breaking|revolutionary|must-read|unparalleled|unrivall?ed|world-class|definitive|indispensable|essential reading|incontournable|révolutionnaire|primé|best-seller|de référence|inégalé)\b/i;

export interface SourceIndex {
  squashed: string;
  figures: Set<string>;
}

export function indexSource(...texts: (string | undefined | null)[]): SourceIndex {
  const all = texts.filter(Boolean).join("\n");
  return { squashed: squash(all), figures: new Set(figures(all)) };
}

export const inSource = (src: SourceIndex, phrase: string) => {
  const s = squash(phrase);
  return s.length > 0 && src.squashed.includes(s);
};

/** Why a sentence can't be traced to the source, or null when it can. */
export function unsupported(sentence: string, src: SourceIndex): string | null {
  const missingFigures = figures(sentence).filter((f) => !src.figures.has(f));
  if (missingFigures.length) return `figure${missingFigures.length > 1 ? "s" : ""} not in the document: ${missingFigures.join(", ")}`;
  const missingNames = namedThings(sentence).filter((n) => !inSource(src, n));
  if (missingNames.length) return `name${missingNames.length > 1 ? "s" : ""} not in the document: ${missingNames.join(", ")}`;
  const hype = sentence.match(HYPE);
  if (hype && !inSource(src, hype[0])) return `promotional claim not in the document: "${hype[0]}"`;
  return null;
}

/** Split prose into sentences, keeping paragraph breaks. */
export function sentences(text: string): { text: string; paragraph: number }[] {
  return text
    .split(/\n\s*\n/)
    .flatMap((para, paragraph) =>
      // Split only where a sentence plainly ends: ".", "!" or "?" then a space
      // and a capital. "62.4" or "e.g. the" never split, and no text is lost.
      para
        .replace(/\s+/g, " ")
        .trim()
        .split(/(?<=[.!?]["»”)]?)\s+(?=["«“(]?\p{Lu})/u)
        .map((s) => ({ text: s.trim(), paragraph }))
        .filter((s) => s.text)
    );
}

export interface Removal {
  text: string;
  reason: string;
}

/**
 * Keep only the sentences of `prose` that trace to the source. Returns null
 * (nothing usable) when more than half had to go — what's left would be a
 * patchwork rather than a description.
 */
export function groundProse(prose: string, src: SourceIndex): { text: string; removed: Removal[]; kept: number } | null {
  const parts = sentences(prose);
  if (!parts.length) return null;
  const removed: Removal[] = [];
  const kept: typeof parts = [];
  for (const s of parts) {
    const why = unsupported(s.text, src);
    if (why) removed.push({ text: s.text, reason: why });
    else kept.push(s);
  }
  if (kept.length === 0 || removed.length > parts.length / 2) return null;
  const paragraphs = new Map<number, string[]>();
  for (const s of kept) paragraphs.set(s.paragraph, [...(paragraphs.get(s.paragraph) ?? []), s.text]);
  return { text: [...paragraphs.values()].map((p) => p.join(" ")).join("\n\n"), removed, kept: kept.length };
}

/** An insight stands only on a real quotation, and only with figures that quotation contains. */
export function groundInsight(insight: { text: string; evidence: string }, src: SourceIndex): string | null {
  if (squash(insight.evidence).length < 15) return "no supporting quotation";
  if (!inSource(src, insight.evidence)) return "its quotation is not in the document";
  const quoted = new Set(figures(insight.evidence));
  const extra = figures(insight.text).filter((f) => !quoted.has(f));
  if (extra.length) return `figure${extra.length > 1 ? "s" : ""} not in its quotation: ${extra.join(", ")}`;
  return unsupported(insight.text, src);
}

/** A translation must carry exactly the figures of its original. */
export function sameFigures(original: string, translation: string): boolean {
  const a = figures(original).sort();
  const b = figures(translation).sort();
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** A tag stands when its words occur in the document. */
export function tagInSource(tag: string, src: SourceIndex): boolean {
  const words = fold(tag).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3);
  // Allow simple plurals/inflections by matching a word's first five letters.
  return words.length > 0 && words.every((w) => src.squashed.includes(squash(w.length > 5 ? w.slice(0, 5) : w)));
}

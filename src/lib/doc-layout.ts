/**
 * Title-page reading: turn positioned text (as a PDF's text layer gives it)
 * into lines, then find the title and subtitle the way a person would — the
 * largest type on the title page, and the line set directly beneath it.
 *
 * Everything returned is copied from the page, never composed: a field is
 * either found verbatim or left empty.
 */

export interface PositionedText {
  str: string;
  /** Left edge and baseline, in page units (origin bottom-left). */
  x: number;
  y: number;
  width: number;
  /** Font size in page units. */
  size: number;
}

export interface Line {
  text: string;
  size: number;
  y: number;
}

/** Group text runs into lines, joining runs by their actual spacing. */
export function buildLines(items: PositionedText[]): Line[] {
  const runs = items
    .filter((i) => i.str.trim() && i.size > 0)
    .sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: { size: number; y: number; runs: PositionedText[] }[] = [];
  for (const r of runs) {
    const line = lines.find((l) => Math.abs(l.y - r.y) < l.size * 0.35 && Math.abs(l.size - r.size) / l.size < 0.08);
    if (line) line.runs.push(r);
    else lines.push({ size: r.size, y: r.y, runs: [r] });
  }
  return lines
    .map((l) => {
      const sorted = l.runs.sort((a, b) => a.x - b.x);
      let text = "";
      let end = -Infinity;
      for (const r of sorted) {
        const gap = r.x - end;
        // Runs that touch belong to one word ("Africa" + "’" + "s"); a real
        // space shows up as a gap of roughly a fifth of the font size.
        if (text && gap > l.size * 0.18 && !text.endsWith(" ")) text += " ";
        text += text.endsWith(" ") ? r.str.trimStart() : r.str;
        end = r.x + r.width;
      }
      return { text: text.replace(/\s+/g, " ").trim(), size: l.size, y: l.y };
    })
    .filter((l) => l.text)
    .sort((a, b) => b.y - a.y);
}

/** Character-weighted median font size: the size of body text. */
export function bodySize(lines: Line[]): number {
  const weighted = lines.flatMap((l) => Array(Math.min(l.text.length, 400)).fill(l.size) as number[]).sort((a, b) => a - b);
  return weighted.length ? weighted[Math.floor(weighted.length / 2)] : 0;
}

const HEADINGS = new RegExp(
  "^(?:\\d+(?:\\.\\d+)*\\.?\\s+)?(?:" +
    [
      "executive summary", "summary", "abstract", "contents", "table of contents", "introduction", "foreword",
      "preface", "acknowledg(?:e)?ments", "brief", "overview", "key findings", "highlights", "chapter \\d+",
      "résumé(?: analytique)?", "sommaire", "table des matières", "avant-propos", "préface", "remerciements",
      "synthèse", "chapitre \\d+",
    ].join("|") +
    ")\\s*:?$",
  "i"
);

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december|" +
  "janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre";

/** A line that is only a date ("September, 2025", "10 September 2025", "2025"). */
export function dateLineYear(text: string): number | null {
  const t = text.trim().replace(/[.,]/g, " ").replace(/\s+/g, " ").toLowerCase();
  const m =
    t.match(new RegExp(`^(?:(?:\\d{1,2}(?:st|nd|rd|th|er)? )?(?:${MONTHS})(?: \\d{1,2}(?:st|nd|rd|th)?)? )?((?:19|20)\\d{2})$`)) ||
    t.match(/^\d{1,2}[/-]\d{1,2}[/-]((?:19|20)\d{2})$/);
  return m ? Number(m[1]) : null;
}

/** "1 Overview…", "2.3 Results" — a numbered section heading. */
const isNumberedHeading = (t: string) => /^\d+(?:\.\d+)*\.?\s+\p{Lu}/u.test(t.trim());
const isContact = (t: string) => /@|https?:|www\.|\+\d[\d\s]{6,}|\|/.test(t);
const isNumeric = (t: string) => (t.match(/\p{L}/gu) ?? []).length < 3;
const isAllCaps = (t: string) => {
  const letters = t.match(/\p{L}/gu) ?? [];
  return letters.length > 3 && letters.every((c) => c === c.toUpperCase());
};

/** Does the line after `prev` continue the same title, or start a subtitle? */
function continues(prev: string, next: string): boolean {
  const p = prev.trim();
  // "Commodity Dependence –" / "… Intelligence:" announce what follows.
  if (/:$|\s[–—-]$/.test(p)) return false;
  if (/[&,]$|\b(?:and|or|of|the|for|in|to|with|a|an|on|at|by|from|their|its|our|et|ou|de|des|du|la|le|les|en|pour|sur|dans|aux?)$/i.test(p)) return true;
  if (/^\p{Ll}/u.test(next.trim())) return true;
  return isAllCaps(p) && isAllCaps(next);
}

export interface TitleBlock {
  title: string;
  subtitle?: string;
  /** Year from a date line on the title page, with the line itself. */
  dateYear?: { year: number; line: string };
  titleSize: number;
  /** All text on the title page, for checks against it. */
  pageText: string;
}

/**
 * Find the title (and subtitle) on a title page. `body` is the document's body
 * text size; a page whose largest type isn't clearly bigger has no title.
 */
export function findTitleBlock(lines: Line[], body: number): TitleBlock | null {
  const usable = lines.filter((l) => !isNumeric(l.text) && !isContact(l.text));
  if (!usable.length) return null;
  const max = Math.max(...usable.map((l) => l.size));
  if (body && max < body * 1.2) return null;

  const start = lines.findIndex((l) => l.size >= max * 0.92 && !isNumeric(l.text) && !isContact(l.text));
  const block: Line[] = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    const prev = block[block.length - 1];
    if (Math.abs(l.size - max) / max > 0.08 || prev.y - l.y > prev.size * 2.2 || isNumeric(l.text)) break;
    block.push(l);
  }

  // Same-size lines are one title unless a line plainly ends and the next
  // starts afresh — then the rest is a subtitle set at the same size.
  let title = block[0].text;
  let subtitleParts: string[] = [];
  for (let i = 1; i < block.length; i++) {
    if (subtitleParts.length) subtitleParts.push(block[i].text);
    else if (continues(block[i - 1].text, block[i].text)) title += " " + block[i].text;
    else subtitleParts = [block[i].text];
  }
  // A title ending in a colon or dash introduces its subtitle.
  const trailing = /\s*(?::|\s[–—-])\s*$/;
  const introducesSubtitle = trailing.test(title);
  title = title.replace(trailing, "").trim();

  let dateYear: TitleBlock["dateYear"];
  const after = lines.slice(start + block.length);
  if (!subtitleParts.length) {
    // The line(s) directly beneath, if they read like a subtitle rather than a
    // heading, a date, a byline or the start of the body.
    const first = after[0];
    if (first && !dateLineYear(first.text) && !isContact(first.text) && !HEADINGS.test(first.text) && !isNumberedHeading(first.text) && !isNumeric(first.text)) {
      const run = [first];
      for (const l of after.slice(1)) {
        if (Math.abs(l.size - first.size) / first.size > 0.08 || run[run.length - 1].y - l.y > l.size * 2) break;
        run.push(l);
      }
      const text = run.map((l) => l.text).join(" ");
      const words = text.split(/\s+/).length;
      const looksLikeSubtitle =
        run.length <= 2 &&
        text.length <= 200 &&
        words >= 2 &&
        words <= 25 &&
        !/[.;]$/.test(text) &&
        first.size < max &&
        (!body || first.size >= body * 0.75 || introducesSubtitle);
      if (looksLikeSubtitle) subtitleParts = run.map((l) => l.text);
    }
  }
  for (const l of after.slice(0, 6)) {
    const year = dateLineYear(l.text);
    if (year) {
      dateYear = { year, line: l.text };
      break;
    }
  }

  const subtitle = subtitleParts.join(" ").replace(/\s+/g, " ").trim() || undefined;
  if (title.length < 3) return null;
  return { title, subtitle, dateYear, titleSize: max, pageText: lines.map((l) => l.text).join("\n") };
}

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "via", "with", "de", "des", "du", "et", "la", "le", "les", "en", "aux", "au", "pour", "sur"]);

/**
 * Title-case a heading set in capitals ("GLOBAL COTTON MARKET ANALYSIS"),
 * keeping acronyms of up to four letters that the document also uses in
 * capitals elsewhere. Only letter case changes; the words are the page's.
 */
export function unshout(text: string, acronyms: Set<string>): string {
  return text
    .split(/(\s+)/)
    .map((w, i) => {
      if (/^\s+$/.test(w)) return w;
      const core = w.replace(/[^\p{L}]/gu, "");
      if (acronyms.has(core)) return w;
      const lower = w.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.replace(/\p{L}/u, (c) => c.toUpperCase());
    })
    .join("");
}

export { isAllCaps };

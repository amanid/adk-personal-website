/**
 * Read the facts of an uploaded document — title, subtitle, author, year,
 * pages, ISBN, language — and its cover, without any AI.
 *
 * Every value is copied from the file and returned with where it was found
 * (and, for text, the line it came from), so the editor can show its
 * provenance. Values that look like software defaults ("Microsoft Word -
 * draft.docx", "Administrator") are rejected and reported, and anything not
 * found stays empty: nothing here is ever guessed.
 */
import { createIsomorphicCanvasFactory, getDocumentProxy, renderPageAsImage } from "unpdf";
import JSZip from "jszip";
import * as cheerio from "cheerio";
import { ensurePdfRuntimePolyfills, queuePdfWork } from "./pdf-runtime";
import { buildLines, bodySize, findTitleBlock, isAllCaps, unshout, type Line, type PositionedText } from "./doc-layout";
import { detectLanguage, languageFromCode } from "./lang-detect";
import { isBlankImage } from "./cover-image";

export interface Fact<T> {
  value: T;
  /** Where it was found, for people: "Title page (largest type)". */
  source: string;
  /** The text it was read from, verbatim, when that differs from the value. */
  evidence?: string;
}

export interface DocumentFacts {
  title?: Fact<string>;
  subtitle?: Fact<string>;
  author?: Fact<string>;
  publicationYear?: Fact<number>;
  pageCount?: Fact<number>;
  isbn?: Fact<string>;
  language?: Fact<string>;
  /** The publisher's own description, when the file carries one. */
  description?: Fact<string>;
  tags?: Fact<string[]>;
  /** Things worth knowing: rejected values, low-resolution covers, etc. */
  notes: string[];
}

export interface RawCover {
  data: Uint8Array;
  source: string;
}

export interface AnalysedDocument {
  facts: DocumentFacts;
  cover: RawCover | null;
  /** Front-matter and sampled text, for the AI draft and the checks on it. */
  text: string;
}

export type DocKind = "pdf" | "epub" | "docx" | "pptx" | "xlsx" | "other";

export function docKind(filename: string, mimeType = ""): DocKind {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === "epub" || mimeType === "application/epub+zip") return "epub";
  if (ext === "docx" || ext === "pptx" || ext === "xlsx") return ext;
  return "other";
}

// ---------------------------------------------------------------------------
// Shared checks

const JUNK_TITLE =
  /^(?:microsoft (?:word|powerpoint|excel)\b|untitled\b|document\s*\d*$|presentation\s*\d*$|pptxgenjs|title$|new document|sans titre|diapositive \d|slide \d)|\.(?:docx?|pptx?|xlsx?|indd|pdf|tex|odt|pages|key|rtf)\s*$/i;
const SOFTWARE =
  /\b(?:word|office|adobe|acrobat|latex|pdf|docx|pptx|pptxgenjs|python-docx|libreoffice|openoffice|writer|google docs|canva|indesign|quark|pages|keynote|reportlab|wkhtmltopdf|chrome|skia)\b/i;
const JUNK_AUTHOR =
  /^(?:admin(?:istrator)?|user|owner|author|unknown|default|guest|windows user|microsoft office user|utilisateur|auteur|research assistant|pc|hp|dell|lenovo|apple)$/i;

export function isJunkTitle(value: string, filename: string): boolean {
  const v = value.trim();
  if (v.length < 3 || JUNK_TITLE.test(v)) return true;
  const stem = filename.replace(/\.[^.]+$/, "");
  if (norm(v) === norm(stem) && /[_]|\d{3,}|v\d/i.test(stem)) return true;
  return /_/.test(v) && !/\s/.test(v);
}

/** Returns the usable author, or null with a reason. */
export function cleanAuthor(value: string): { ok: string } | { rejected: string } {
  const v = value.trim().replace(/^(?:prepared|written|compiled)\s+by\s+/i, "");
  if (!v) return { rejected: "empty" };
  if (JUNK_AUTHOR.test(v) || SOFTWARE.test(v) || /\d/.test(v) || !/\p{L}{2}/u.test(v)) return { rejected: value.trim() };
  return { ok: v };
}

/** Lowercased, accents and punctuation folded: for comparing, never for display. */
export function norm(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Valid ISBN-10 or ISBN-13 (checksum included), digits only. */
export function validIsbn(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{13}$/.test(s)) {
    if (!/^97[89]/.test(s)) return null;
    const sum = [...s].reduce((acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1), 0);
    return sum % 10 === 0 ? s : null;
  }
  if (/^\d{9}[\dX]$/.test(s)) {
    const sum = [...s].reduce((acc, d, i) => acc + (d === "X" ? 10 : Number(d)) * (10 - i), 0);
    return sum % 11 === 0 ? s : null;
  }
  return null;
}

const YEAR_MAX = new Date().getUTCFullYear() + 2;
const plausibleYear = (y: number) => y >= 1900 && y <= YEAR_MAX;

/**
 * ISBN and publication year from the copyright / imprint text, each with the
 * line it was read from. `pages` are labelled chunks of text.
 */
export function scanImprint(pages: { label: string; text: string }[]): Pick<DocumentFacts, "isbn" | "publicationYear"> & { otherIsbns: string[] } {
  const out: Pick<DocumentFacts, "isbn" | "publicationYear"> & { otherIsbns: string[] } = { otherIsbns: [] };
  const found: { isbn: string; line: string; label: string; electronic: boolean }[] = [];
  for (const { label, text } of pages) {
    for (const line of text.split(/\n/)) {
      const re = /ISBN(?:[- ]?1[03])?\s*(?:\(([^)]{0,30})\))?\s*[:：]?\s*((?:97[89][\s-]?)?\d[\d\s-]{7,15}[\dXx])\b(?:\s*\(([^)]{0,30})\))?/gi;
      for (const m of line.matchAll(re)) {
        const isbn = validIsbn(m[2]);
        if (!isbn) continue;
        const qualifier = `${m[1] ?? ""} ${m[3] ?? ""} ${line}`;
        found.push({ isbn, line: line.trim(), label, electronic: /e-?book|pdf|epub|electronic|digital|numérique|en ligne|online|e-isbn/i.test(qualifier) });
      }
    }
  }
  const unique = [...new Map(found.map((f) => [f.isbn, f])).values()];
  if (unique.length) {
    // A file is the electronic edition: prefer an ISBN labelled as such.
    const pick = unique.find((f) => f.electronic) ?? unique.find((f) => f.isbn.length === 13) ?? unique[0];
    out.isbn = { value: pick.isbn, source: `ISBN printed in the document (${pick.label}), checksum verified`, evidence: pick.line };
    out.otherIsbns = unique.filter((f) => f !== pick).map((f) => f.isbn);
  }

  const patterns: { re: RegExp; what: string }[] = [
    { re: /(?:©|\(c\)|copyright)\s*(?:©\s*)?((?:19|20)\d{2}(?:\s*[-–,]\s*(?:19|20)\d{2})*)/i, what: "Copyright line" },
    { re: /(?:first\s+)?(?:published|publi(?:é|e)e?|édition|edition)\s+(?:in\s+|en\s+)?(?:\p{L}+\s+)?((?:19|20)\d{2})\b/iu, what: "Publication line" },
    { re: /dépôt légal\s*:?\s*(?:\p{L}+\s+)?((?:19|20)\d{2})\b/iu, what: "Legal deposit line" },
  ];
  for (const { re, what } of patterns) {
    for (const { label, text } of pages) {
      const line = text.split(/\n/).find((l) => re.test(l));
      if (!line) continue;
      const years = (line.match(re)![1].match(/(?:19|20)\d{2}/g) ?? []).map(Number).filter(plausibleYear);
      if (!years.length) continue;
      out.publicationYear = { value: Math.max(...years), source: `${what} (${label})`, evidence: line.trim() };
      return out;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// PDF

const PDF_PAGES_FRONT = 6;
const PDF_PAGES_BACK = 3;

function pdfDate(value: unknown): string | null {
  const m = String(value ?? "").match(/^D:(\d{4})(\d{2})?(\d{2})?/);
  return m ? `${m[1]}-${m[2] ?? "01"}-${m[3] ?? "01"}` : null;
}

interface PdfTextItem {
  str?: string;
  transform?: number[];
  width?: number;
}

function positioned(items: unknown[]): PositionedText[] {
  return (items as PdfTextItem[])
    .filter((i) => typeof i.str === "string" && i.transform && Math.abs(i.transform[1]) <= 0.01 * Math.abs(i.transform[0] || 1))
    .map((i) => ({ str: i.str!, x: i.transform![4], y: i.transform![5], width: i.width ?? 0, size: Math.hypot(i.transform![2], i.transform![3]) }));
}

async function analysePdf(buffer: Uint8Array, filename: string, renderCover: (page: number, pdf: Awaited<ReturnType<typeof getDocumentProxy>>) => Promise<RawCover | null>): Promise<AnalysedDocument> {
  ensurePdfRuntimePolyfills();
  return queuePdfWork(async () => {
    const facts: DocumentFacts = { notes: [] };
    // Our own canvas factory: pdf.js's built-in one is stubbed out in unpdf's
    // build, and any document opened without this one can't be rendered.
    const CanvasFactory = await createIsomorphicCanvasFactory(() => import("@napi-rs/canvas"));
    const pdf = await getDocumentProxy(buffer, { CanvasFactory });
    try {
      const total = pdf.numPages;
      facts.pageCount = { value: total, source: "Page count of the PDF" };
      const info = ((await pdf.getMetadata().catch(() => null))?.info ?? {}) as Record<string, unknown>;

      // Front matter, back matter and a few pages from the middle.
      const wanted = new Set<number>();
      for (let n = 1; n <= Math.min(PDF_PAGES_FRONT, total); n++) wanted.add(n);
      for (let n = Math.max(1, total - PDF_PAGES_BACK + 1); n <= total; n++) wanted.add(n);
      for (const f of [0.3, 0.5, 0.7]) wanted.add(Math.max(1, Math.min(total, Math.round(total * f))));
      const pages = new Map<number, Line[]>();
      for (const n of [...wanted].sort((a, b) => a - b)) {
        const page = await pdf.getPage(n);
        try {
          pages.set(n, buildLines(positioned((await page.getTextContent()).items)));
        } finally {
          page.cleanup();
        }
      }
      const allLines = [...pages.values()].flat();
      const text = [...pages.entries()].map(([, lines]) => lines.map((l) => l.text).join("\n")).join("\n\n");
      if (allLines.length === 0) facts.notes.push("The PDF has no text layer (a scan?), so only its page count and cover could be read.");

      // Title page: the first of the opening pages that has text.
      const body = bodySize(allLines);
      let titleBlock = null;
      let titlePage = 0;
      for (let n = 1; n <= Math.min(3, total); n++) {
        const lines = pages.get(n) ?? [];
        if (!lines.length) continue;
        titleBlock = findTitleBlock(lines, body);
        titlePage = n;
        break;
      }

      const metaTitle = typeof info.Title === "string" ? info.Title.trim() : "";
      const metaTitleOk = metaTitle && !isJunkTitle(metaTitle, filename);
      if (metaTitle && !metaTitleOk) facts.notes.push(`Ignored the file's embedded title "${metaTitle}" — it is a software default, not the book's title.`);

      if (titleBlock) {
        let title = titleBlock.title;
        const where = `Title page${titlePage > 1 ? ` (page ${titlePage})` : ""}, largest type`;
        if (isAllCaps(title)) {
          // Set in capitals on the page: take the casing from the file's own
          // title when it is the same words, else lower-case all but acronyms.
          const cased = metaTitleOk ? sameWordsPrefix(metaTitle, title) : null;
          if (cased) {
            title = cased;
          } else {
            title = unshout(title, acronymsIn(text));
            facts.notes.push("The title is set in capitals on the page; its letter case was adjusted. Check it.");
          }
        }
        facts.title = { value: title, source: where, evidence: titleBlock.title !== title ? titleBlock.title : undefined };
        if (titleBlock.subtitle) {
          const sub = isAllCaps(titleBlock.subtitle) ? unshout(titleBlock.subtitle, acronymsIn(text)) : titleBlock.subtitle;
          facts.subtitle = { value: sub, source: "Title page, beneath the title", evidence: sub !== titleBlock.subtitle ? titleBlock.subtitle : undefined };
        }
      } else if (metaTitleOk) {
        facts.title = { value: metaTitle, source: "Title stored in the PDF's properties" };
      }

      const metaAuthor = typeof info.Author === "string" ? info.Author.trim() : "";
      if (metaAuthor) {
        const a = cleanAuthor(metaAuthor);
        if ("ok" in a) facts.author = { value: a.ok, source: "Author stored in the PDF's properties", evidence: a.ok !== metaAuthor ? metaAuthor : undefined };
        else facts.notes.push(`Ignored the file's embedded author "${a.rejected}" — it is not a person's name.`);
      }

      const subject = typeof info.Subject === "string" ? info.Subject.trim() : "";
      if (subject && !SOFTWARE.test(subject) && !isJunkTitle(subject, filename)) {
        if (subject.length >= 80) facts.description = { value: subject, source: "Description stored in the PDF's properties" };
        else if (!facts.subtitle && titleBlock && norm(titleBlock.pageText).includes(norm(subject))) {
          facts.subtitle = { value: subject, source: "Subject stored in the PDF's properties, also printed on the title page" };
        }
      }
      const keywords = typeof info.Keywords === "string" ? info.Keywords : "";
      const tags = keywords.split(/[,;]/).map((k) => k.trim()).filter((k) => k && k.length <= 40 && !SOFTWARE.test(k));
      if (tags.length) facts.tags = { value: [...new Set(tags)].slice(0, 10), source: "Keywords stored in the PDF's properties" };

      const imprint = scanImprint(
        [...pages.entries()].map(([n, lines]) => ({ label: `page ${n}`, text: lines.map((l) => l.text).join("\n") }))
      );
      if (imprint.isbn) facts.isbn = imprint.isbn;
      if (imprint.otherIsbns.length) facts.notes.push(`Other ISBNs printed in the document (other editions?): ${imprint.otherIsbns.join(", ")}.`);
      if (imprint.publicationYear) facts.publicationYear = imprint.publicationYear;
      else if (titleBlock?.dateYear && plausibleYear(titleBlock.dateYear.year)) {
        facts.publicationYear = { value: titleBlock.dateYear.year, source: "Date on the title page", evidence: titleBlock.dateYear.line };
      }
      const created = pdfDate(info.CreationDate);
      if (!facts.publicationYear && created) {
        facts.notes.push(`No publication year is printed in the document. The PDF file itself was created on ${created}, which is not necessarily the publication date.`);
      }

      const detected = detectLanguage(text);
      const declared = languageFromCode(typeof info.Language === "string" ? info.Language : null);
      if (detected) facts.language = { value: detected.language, source: "Detected from the document's text" };
      else if (declared) facts.language = { value: declared, source: "Language declared in the PDF" };

      const safeRender = async (n: number) => {
        try {
          return await renderCover(n, pdf);
        } catch (err) {
          console.error(`PDF cover render failed (page ${n}):`, (err as Error).message);
          return null;
        }
      };
      let cover = await safeRender(1);
      if (!cover && total > 1) cover = await safeRender(2);
      if (!cover) facts.notes.push("The first pages could not be turned into a cover image. Upload a cover.");
      return { facts, cover, text };
    } finally {
      await pdf.destroy();
    }
  });
}

/** The leading words of `source` that spell exactly `target` (case aside), else null. */
function sameWordsPrefix(source: string, target: string): string | null {
  const words = source.split(/\s+/);
  for (let k = 1; k <= words.length; k++) {
    const prefix = words.slice(0, k).join(" ");
    if (norm(prefix) === norm(target)) return prefix.replace(/[\s:–—-]+$/, "");
    if (norm(prefix).length > norm(target).length) break;
  }
  return null;
}

/** Acronyms the document itself writes in capitals (kept when un-shouting). */
function acronymsIn(text: string): Set<string> {
  const counts = new Map<string, number>();
  for (const w of text.match(/\b\p{Lu}{2,5}\b/gu) ?? []) counts.set(w, (counts.get(w) ?? 0) + 1);
  return new Set([...counts].filter(([, n]) => n >= 2).map(([w]) => w));
}

// ---------------------------------------------------------------------------
// EPUB

async function epubOpf(zip: JSZip) {
  const container = await zip.file("META-INF/container.xml")?.async("text");
  let opfPath = container ? cheerio.load(container, { xmlMode: true })("rootfile").attr("full-path") : undefined;
  opfPath ||= Object.keys(zip.files).find((f) => f.toLowerCase().endsWith(".opf"));
  if (!opfPath) return null;
  const xml = await zip.file(opfPath)?.async("text");
  if (!xml) return null;
  return { dir: opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "", $: cheerio.load(xml, { xmlMode: true }) };
}

function resolvePath(base: string, href: string): string {
  const parts = (base + decodeURIComponent(href.split("#")[0])).split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p !== ".") out.push(p);
  }
  return out.join("/");
}

async function analyseEpub(buffer: Uint8Array): Promise<AnalysedDocument> {
  const facts: DocumentFacts = { notes: [] };
  const zip = await JSZip.loadAsync(buffer);
  const opf = await epubOpf(zip);
  if (!opf) {
    facts.notes.push("This EPUB has no package document, so nothing could be read from it.");
    return { facts, cover: null, text: "" };
  }
  const { $, dir } = opf;
  const src = "EPUB metadata";
  const pick = (sel: string) => $(sel).first().text().trim() || undefined;

  // EPUB 3 can mark a subtitle explicitly; otherwise "Title: Subtitle" is the convention.
  const titles = $("dc\\:title, title").toArray();
  const mainTitle = titles.find((el) => {
    const id = $(el).attr("id");
    return !id || $(`meta[refines="#${id}"][property="title-type"]`).text().trim() !== "subtitle";
  });
  const subEl = titles.find((el) => {
    const id = $(el).attr("id");
    return id && $(`meta[refines="#${id}"][property="title-type"]`).text().trim() === "subtitle";
  });
  const rawTitle = mainTitle ? $(mainTitle).text().trim() : "";
  if (rawTitle) {
    const split = !subEl && rawTitle.match(/^(.{3,}?):\s+(.{3,})$/);
    facts.title = { value: split ? split[1].trim() : rawTitle, source: src, evidence: split ? rawTitle : undefined };
    if (split) facts.subtitle = { value: split[2].trim(), source: `${src} (the part of the title after the colon)`, evidence: rawTitle };
  }
  if (subEl) facts.subtitle = { value: $(subEl).text().trim(), source: `${src} (marked as subtitle)` };

  const creator = pick("dc\\:creator, creator");
  if (creator) {
    const a = cleanAuthor(creator);
    if ("ok" in a) facts.author = { value: a.ok, source: src };
    else facts.notes.push(`Ignored the EPUB's author "${a.rejected}" — it is not a person's name.`);
  }
  const lang = languageFromCode(pick("dc\\:language, language"));
  const description = pick("dc\\:description, description");
  if (description) {
    const plain = cheerio.load(description).text().replace(/\s+/g, " ").trim();
    if (plain.length >= 40) facts.description = { value: plain, source: `${src} (publisher's description)` };
  }
  const subjects = $("dc\\:subject, subject").map((_, el) => $(el).text().trim()).get().filter((s: string) => s && s.length <= 40);
  if (subjects.length) facts.tags = { value: [...new Set(subjects as string[])].slice(0, 10), source: `${src} (subjects)` };
  $("dc\\:identifier, identifier").each((_, el) => {
    if (facts.isbn) return;
    const isbn = validIsbn($(el).text().replace(/^urn:isbn:/i, ""));
    if (isbn) facts.isbn = { value: isbn, source: `${src}, checksum verified` };
  });
  const date = pick("dc\\:date, date");
  const metaYear = date?.match(/\b((?:19|20)\d{2})\b/);

  // Text in reading order, for the imprint and the language.
  const idToHref = new Map<string, { href: string; type: string; props: string }>();
  $("manifest > item, item").each((_, el) => {
    const id = $(el).attr("id");
    const href = $(el).attr("href");
    if (id && href) idToHref.set(id, { href, type: $(el).attr("media-type") || "", props: $(el).attr("properties") || "" });
  });
  const spine = $("spine > itemref, itemref").map((_, el) => $(el).attr("idref")).get() as string[];
  const docs = spine.map((id) => idToHref.get(id)).filter((d): d is { href: string; type: string; props: string } => !!d && /html|xml/.test(d.type));
  const chunks: { label: string; text: string; html: string; path: string }[] = [];
  let length = 0;
  for (const [i, d] of docs.entries()) {
    if (length > 80000) break;
    const path = resolvePath(dir, d.href);
    const html = await zip.file(path)?.async("text");
    if (!html) continue;
    const $$ = cheerio.load(html);
    $$("script, style").remove();
    $$("p, div, h1, h2, h3, h4, li, br, tr").after("\n");
    const t = $$("body").text().replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
    chunks.push({ label: `section ${i + 1}`, text: t, html, path });
    length += t.length;
  }
  const text = chunks.map((c) => c.text).join("\n\n");
  const imprint = scanImprint(chunks.slice(0, 8));
  if (!facts.isbn && imprint.isbn) facts.isbn = imprint.isbn;
  if (imprint.publicationYear) facts.publicationYear = imprint.publicationYear;
  else if (metaYear && plausibleYear(Number(metaYear[1]))) facts.publicationYear = { value: Number(metaYear[1]), source: `${src} (date)`, evidence: date };

  const detected = detectLanguage(text);
  if (detected) facts.language = { value: detected.language, source: "Detected from the book's text" };
  else if (lang) facts.language = { value: lang, source: src };

  // Cover: every way an EPUB can declare one, most explicit first.
  const candidates: { path: string; how: string }[] = [];
  const add = (href: string | undefined, base: string, how: string) => href && candidates.push({ path: resolvePath(base, href), how });
  const coverId = $('meta[name="cover"]').attr("content");
  if (coverId) add(idToHref.get(coverId)?.href, dir, "EPUB cover (declared in metadata)");
  for (const [, d] of idToHref) if (/\bcover-image\b/.test(d.props)) add(d.href, dir, "EPUB cover (cover-image property)");
  const guideHref = $('guide reference[type="cover"]').attr("href");
  const coverPages = [guideHref ? resolvePath(dir, guideHref) : null, chunks[0]?.path].filter(Boolean) as string[];
  for (const p of coverPages) {
    const html = await zip.file(p)?.async("text");
    if (!html) continue;
    const $$ = cheerio.load(html, { xmlMode: false });
    const img = $$("img").attr("src") || $$("image").attr("xlink:href") || $$("image").attr("href");
    if (img) add(img, p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "", "Image on the EPUB's cover page");
  }
  for (const [id, d] of idToHref) if (/^image\//.test(d.type) && /cover/i.test(id + d.href)) add(d.href, dir, "EPUB image named \"cover\"");

  let cover: RawCover | null = null;
  for (const c of candidates) {
    const data = await zip.file(c.path)?.async("uint8array");
    if (data) {
      cover = { data, source: c.how };
      break;
    }
  }
  return { facts, cover, text };
}

// ---------------------------------------------------------------------------
// Word, PowerPoint, Excel (Office Open XML)

async function analyseOoxml(buffer: Uint8Array, kind: "docx" | "pptx" | "xlsx", filename: string): Promise<AnalysedDocument> {
  const facts: DocumentFacts = { notes: [] };
  const zip = await JSZip.loadAsync(buffer);
  const xml = async (p: string) => {
    const s = await zip.file(p)?.async("text");
    return s ? cheerio.load(s, { xmlMode: true }) : null;
  };
  const label = { docx: "Word", pptx: "PowerPoint", xlsx: "Excel" }[kind];
  const core = await xml("docProps/core.xml");
  const app = await xml("docProps/app.xml");
  const coreField = (tag: string) => core?.(tag.replace(":", "\\:")).first().text().trim() || "";

  let text = "";
  let visibleTitle = "";
  let visibleSubtitle = "";
  if (kind === "docx") {
    const doc = await xml("word/document.xml");
    if (doc) {
      const paras = doc("w\\:p").toArray().map((p) => ({
        style: doc(p).find("w\\:pStyle").attr("w:val") || "",
        text: doc(p).find("w\\:t").map((_, t) => doc(t).text()).get().join(""),
      }));
      text = paras.map((p) => p.text).join("\n").slice(0, 120000);
      visibleTitle = paras.find((p) => /^(?:title|titre|titel|titolo|título)$/i.test(p.style) && p.text.trim())?.text.trim() ?? "";
      visibleSubtitle = paras.find((p) => /^(?:subtitle|sous-?titre|untertitel|sottotitolo|subtítulo)$/i.test(p.style) && p.text.trim())?.text.trim() ?? "";
    }
  } else if (kind === "pptx") {
    const slides = Object.keys(zip.files)
      .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
    for (const [i, path] of slides.entries()) {
      const s = await xml(path);
      if (!s) continue;
      const shapes = s("p\\:sp").toArray().map((sp) => ({
        ph: s(sp).find("p\\:ph").attr("type") || "",
        text: s(sp).find("a\\:p").map((_, p) => s(p).find("a\\:t").map((__, t) => s(t).text()).get().join("")).get().join("\n").trim(),
      }));
      if (i === 0) {
        visibleTitle = shapes.find((sh) => /^(?:ctrTitle|title)$/.test(sh.ph) && sh.text)?.text.replace(/\n/g, " ") ?? "";
        visibleSubtitle = shapes.find((sh) => sh.ph === "subTitle" && sh.text)?.text.replace(/\n/g, " ") ?? "";
      }
      text += shapes.map((sh) => sh.text).join("\n") + "\n\n";
      if (text.length > 120000) break;
    }
  }

  const coreTitle = coreField("dc:title");
  if (visibleTitle) facts.title = { value: visibleTitle, source: kind === "pptx" ? "Title of the first slide" : "Paragraph styled as the document title" };
  else if (coreTitle && !isJunkTitle(coreTitle, filename)) facts.title = { value: coreTitle, source: `Title stored in the ${label} file's properties` };
  else if (coreTitle) facts.notes.push(`Ignored the file's embedded title "${coreTitle}" — it is a software default.`);
  if (visibleSubtitle) facts.subtitle = { value: visibleSubtitle, source: kind === "pptx" ? "Subtitle of the first slide" : "Paragraph styled as the subtitle" };

  const creator = coreField("dc:creator");
  if (creator) {
    const a = cleanAuthor(creator);
    if ("ok" in a) facts.author = { value: a.ok, source: `Author stored in the ${label} file's properties` };
    else facts.notes.push(`Ignored the file's embedded author "${a.rejected}" — it is not a person's name.`);
  }
  const subject = coreField("dc:subject") || coreField("dc:description");
  if (subject.length >= 80) facts.description = { value: subject, source: `Description stored in the ${label} file's properties` };
  const keywords = coreField("cp:keywords").split(/[,;]/).map((k) => k.trim()).filter((k) => k && k.length <= 40);
  if (keywords.length) facts.tags = { value: [...new Set(keywords)].slice(0, 10), source: `Keywords stored in the ${label} file's properties` };

  // Word stores the page count it laid out when it last saved, alongside a
  // word count. Tools that write .docx without laying it out leave stale
  // template values, so the page count is trusted only when the stored word
  // count matches the text actually in the file.
  const pages = Number(app?.("Pages").first().text());
  if (kind === "docx" && pages > 0) {
    const storedWords = Number(app?.("Words").first().text());
    const actualWords = (text.match(/\S+/g) ?? []).length;
    const current = storedWords > 0 && actualWords > 0 && Math.abs(storedWords - actualWords) / actualWords <= 0.1;
    if (current) facts.pageCount = { value: pages, source: "Page count Word recorded when it last saved the file", evidence: `${storedWords} words recorded; ${actualWords} in the text` };
    else facts.notes.push("The page count stored in this Word file is out of date (it wasn't laid out by Word after its last edit), so it was not used. Enter it by hand.");
  }
  if (kind === "pptx") {
    const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).length;
    if (slides) facts.pageCount = { value: slides, source: "Number of slides in the file" };
  }

  if (text) {
    const imprint = scanImprint([{ label: "document text", text: text.slice(0, 30000) }]);
    if (imprint.isbn) facts.isbn = imprint.isbn;
    if (imprint.publicationYear) facts.publicationYear = imprint.publicationYear;
    const detected = detectLanguage(text);
    if (detected) facts.language = { value: detected.language, source: "Detected from the document's text" };
  }
  if (!facts.language) {
    const lang = languageFromCode(coreField("dc:language"));
    if (lang) facts.language = { value: lang, source: `Language declared in the ${label} file` };
  }

  // Office saves a preview of the first page/slide when asked to.
  const thumbPath = Object.keys(zip.files).find((f) => /^docProps\/thumbnail\.(?:jpe?g|png)$/i.test(f));
  const thumb = thumbPath ? await zip.file(thumbPath)!.async("uint8array") : null;
  const cover = thumb ? { data: thumb, source: `Preview image saved in the ${label} file` } : null;
  if (!cover) facts.notes.push(`This ${label} file has no saved preview image, so no cover could be taken from it. Upload a cover image.`);
  return { facts, cover, text };
}

// ---------------------------------------------------------------------------

export type CoverRenderer = (page: number, pdf: Awaited<ReturnType<typeof getDocumentProxy>>) => Promise<RawCover | null>;

/** Render one PDF page at a fixed width (independent of the page's size). */
export const renderPdfPage: CoverRenderer = async (page, pdf) => {
  const raster = await renderPageAsImage(pdf, page, { width: 900, canvasImport: () => import("@napi-rs/canvas") });
  if (await isBlankImage(raster)) return null;
  return { data: new Uint8Array(raster), source: page === 1 ? "First page of the PDF" : `Page ${page} of the PDF (page 1 is blank)` };
};

/**
 * Analyse an uploaded file.
 *
 * pdf.js takes over (detaches) the memory of the bytes it is given, leaving
 * the caller's buffer empty — and a small Node Buffer can share its memory
 * with unrelated ones. So the PDF is copied first, unless the caller passes
 * `consume: true` for a buffer it owns outright and won't touch again, which
 * spares a 50MB copy on a small instance.
 */
export async function analyseDocument(
  buffer: Uint8Array,
  filename: string,
  mimeType: string,
  { coverRenderer = renderPdfPage, consume = false }: { coverRenderer?: CoverRenderer; consume?: boolean } = {}
): Promise<AnalysedDocument> {
  const kind = docKind(filename, mimeType);
  try {
    if (kind === "pdf") {
      const owned = consume && buffer.byteOffset === 0 && buffer.byteLength === buffer.buffer.byteLength;
      // Always a plain Uint8Array: pdf.js refuses Node Buffers.
      const bytes = owned ? new Uint8Array(buffer.buffer, 0, buffer.byteLength) : new Uint8Array(buffer);
      return await analysePdf(bytes, filename, coverRenderer);
    }
    if (kind === "epub") return await analyseEpub(buffer);
    if (kind === "docx" || kind === "pptx" || kind === "xlsx") return await analyseOoxml(buffer, kind, filename);
  } catch (err) {
    console.error("Document analysis failed:", (err as Error).message);
    return { facts: { notes: ["The file could not be read (damaged or password-protected?). Fill the fields by hand."] }, cover: null, text: "" };
  }
  return { facts: { notes: ["This file type carries no title, author or cover to read. Fill the fields and upload a cover image."] }, cover: null, text: "" };
}

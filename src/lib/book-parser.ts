/**
 * Extracts book metadata (and, for EPUB, the cover image) from an uploaded
 * PDF or EPUB file so the bookstore can auto-populate a book's fields.
 *
 * Pure server-side parsing:
 *  - PDF  → pdf-lib reads the document info dictionary + page count.
 *  - EPUB → jszip opens the archive, cheerio reads the OPF (Dublin Core) and
 *           the referenced cover image is extracted.
 * All fields are best-effort; anything not found is simply omitted.
 */
import { PDFDocument } from "pdf-lib";
import { extractText, getDocumentProxy } from "unpdf";
import JSZip from "jszip";
import * as cheerio from "cheerio";

export interface ParsedCover {
  mimeType: string;
  data: Uint8Array;
}

export interface ParsedBookMeta {
  title?: string;
  subtitle?: string;
  author?: string;
  publicationYear?: number;
  pageCount?: number;
  language?: string;
  isbn?: string;
  description?: string;
  keyInsights?: string[];
  cover?: ParsedCover | null;
}

function fileType(filename: string, mimeType: string): "pdf" | "epub" | "unknown" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === "epub" || mimeType === "application/epub+zip") return "epub";
  return "unknown";
}

/** Turn a file name into a reasonable title fallback ("my_book-v2.pdf" → "My Book V2"). */
function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function yearFromString(value?: string | Date | null): number | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    const y = value.getFullYear();
    return y > 1400 && y < 3000 ? y : undefined;
  }
  const match = String(value).match(/\b(1[4-9]\d{2}|20\d{2}|21\d{2})\b/);
  return match ? Number(match[1]) : undefined;
}

function cleanIsbn(value?: string | null): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/[^0-9Xx]/g, "");
  if (digits.length === 13 || digits.length === 10) return digits.toUpperCase();
  return undefined;
}

async function parsePdf(buffer: Buffer, filename: string): Promise<ParsedBookMeta> {
  try {
    const doc = await PDFDocument.load(buffer, {
      updateMetadata: false,
      ignoreEncryption: true,
    });

    const title = doc.getTitle()?.trim();
    const author = doc.getAuthor()?.trim();
    const subject = doc.getSubject()?.trim();
    const keywords = doc.getKeywords()?.trim();
    const created = doc.getCreationDate();

    const keyInsights = keywords
      ? keywords
          .split(/[,;]/)
          .map((k) => k.trim())
          .filter(Boolean)
          .slice(0, 10)
      : undefined;

    return {
      title: title || titleFromFilename(filename),
      author: author || undefined,
      publicationYear: yearFromString(created),
      pageCount: doc.getPageCount(),
      description: subject || undefined,
      keyInsights: keyInsights?.length ? keyInsights : undefined,
      cover: null,
    };
  } catch {
    // Encrypted/corrupt PDF — fall back to filename only.
    return { title: titleFromFilename(filename), cover: null };
  }
}

async function parseEpub(buffer: Buffer, filename: string): Promise<ParsedBookMeta> {
  try {
    const zip = await JSZip.loadAsync(buffer);

    // 1. Locate the OPF via META-INF/container.xml.
    const containerXml = await zip.file("META-INF/container.xml")?.async("text");
    let opfPath: string | undefined;
    if (containerXml) {
      const $c = cheerio.load(containerXml, { xmlMode: true });
      opfPath = $c("rootfile").attr("full-path") || undefined;
    }
    if (!opfPath) {
      // Fallback: first .opf in the archive.
      opfPath = Object.keys(zip.files).find((f) => f.toLowerCase().endsWith(".opf"));
    }
    if (!opfPath) return { title: titleFromFilename(filename), cover: null };

    const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
    const opfXml = await zip.file(opfPath)?.async("text");
    if (!opfXml) return { title: titleFromFilename(filename), cover: null };

    const $ = cheerio.load(opfXml, { xmlMode: true });

    const pick = (sel: string) => $(sel).first().text().trim() || undefined;

    const title = pick("dc\\:title, title");
    const author = pick("dc\\:creator, creator");
    const language = pick("dc\\:language, language");
    const description = pick("dc\\:description, description");
    const dateStr = pick("dc\\:date, date");

    // ISBN: any dc:identifier that looks like an ISBN.
    let isbn: string | undefined;
    $("dc\\:identifier, identifier").each((_, el) => {
      if (isbn) return;
      const val = cleanIsbn($(el).text());
      if (val) isbn = val;
    });

    // Cover image: <meta name="cover" content="ID"> → manifest item, or
    // an item with properties="cover-image".
    let coverHref: string | undefined;
    let coverMime: string | undefined;
    const coverId = $('meta[name="cover"]').attr("content");
    if (coverId) {
      const item = $(`manifest > item#${coverId}, item[id="${coverId}"]`).first();
      coverHref = item.attr("href");
      coverMime = item.attr("media-type");
    }
    if (!coverHref) {
      const item = $('item[properties~="cover-image"]').first();
      coverHref = item.attr("href");
      coverMime = item.attr("media-type");
    }

    let cover: ParsedCover | null = null;
    if (coverHref) {
      const coverPath = decodeURIComponent(opfDir + coverHref);
      const entry = zip.file(coverPath) || zip.file(coverHref);
      if (entry) {
        const data = await entry.async("uint8array");
        cover = {
          mimeType: coverMime || guessImageMime(coverHref),
          data,
        };
      }
    }

    return {
      title: title || titleFromFilename(filename),
      author,
      language,
      description,
      isbn,
      publicationYear: yearFromString(dateStr),
      cover,
    };
  } catch {
    return { title: titleFromFilename(filename), cover: null };
  }
}

function guessImageMime(href: string): string {
  const ext = href.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Parse a PDF or EPUB buffer into best-effort book metadata. */
export async function parseBookFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ParsedBookMeta> {
  const type = fileType(filename, mimeType);
  if (type === "pdf") return parsePdf(buffer, filename);
  if (type === "epub") return parseEpub(buffer, filename);
  return { title: titleFromFilename(filename), cover: null };
}

async function extractPdfText(buffer: Buffer, maxChars: number): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join("\n") : text;
  return (merged || "").slice(0, maxChars);
}

async function extractEpubText(buffer: Buffer, maxChars: number): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  // Read spine order from the OPF so text flows in reading order.
  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  let opfPath: string | undefined;
  if (containerXml) {
    opfPath = cheerio.load(containerXml, { xmlMode: true })("rootfile").attr("full-path");
  }
  opfPath =
    opfPath || Object.keys(zip.files).find((f) => f.toLowerCase().endsWith(".opf"));
  if (!opfPath) return "";

  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const opfXml = await zip.file(opfPath)?.async("text");
  if (!opfXml) return "";

  const $ = cheerio.load(opfXml, { xmlMode: true });
  const idToHref = new Map<string, string>();
  $("manifest > item, item").each((_, el) => {
    const id = $(el).attr("id");
    const href = $(el).attr("href");
    const mediaType = $(el).attr("media-type") || "";
    if (id && href && /xhtml|html|xml/.test(mediaType)) idToHref.set(id, href);
  });

  const spine = $("spine > itemref, itemref")
    .map((_, el) => $(el).attr("idref"))
    .get()
    .filter(Boolean) as string[];

  const hrefs = spine.length
    ? spine.map((id) => idToHref.get(id)).filter(Boolean as unknown as (x: string | undefined) => x is string)
    : [...idToHref.values()];

  let text = "";
  for (const href of hrefs) {
    if (text.length >= maxChars) break;
    const path = decodeURIComponent(opfDir + href);
    const html = (await zip.file(path)?.async("text")) || (await zip.file(href)?.async("text"));
    if (!html) continue;
    const $$ = cheerio.load(html);
    $$("script, style").remove();
    const pageText = $$("body").text().replace(/\s+/g, " ").trim();
    if (pageText) text += pageText + "\n\n";
  }

  return text.slice(0, maxChars);
}

/**
 * Extract a plain-text sample from a book file (reading order, capped length)
 * for downstream AI summarization. Returns "" if nothing could be extracted.
 */
export async function extractBookText(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  maxChars = 16000
): Promise<string> {
  try {
    const type = fileType(filename, mimeType);
    if (type === "pdf") return await extractPdfText(buffer, maxChars);
    if (type === "epub") return await extractEpubText(buffer, maxChars);
    return "";
  } catch (err) {
    console.error("Book text extraction failed:", err);
    return "";
  }
}

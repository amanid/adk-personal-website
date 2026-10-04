/**
 * Text sampling for AI drafting: reads a bounded, representative sample of a
 * PDF or EPUB's text. (Facts and covers are read by src/lib/doc-facts.ts.)
 */
import { getDocumentProxy } from "unpdf";
import JSZip from "jszip";
import * as cheerio from "cheerio";
import { ensurePdfRuntimePolyfills, queuePdfWork } from "./pdf-runtime";

function fileType(filename: string, mimeType: string): "pdf" | "epub" | "unknown" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === "epub" || mimeType === "application/epub+zip") return "epub";
  return "unknown";
}

/**
 * Pull text out of a PDF without ever holding the whole document's text layer.
 *
 * The obvious `extractText(pdf, { mergePages: true })` reads EVERY page into the
 * heap and only then truncates — on a small instance a few-hundred-page book is
 * enough to OOM the process (which the platform turns into an HTML 502, not a
 * JSON error). Instead we walk a bounded set of pages, release each one as we
 * go, and stop as soon as we have enough characters.
 *
 * Long books are sampled at an even stride rather than read front-to-back, so
 * the text still spans the whole work — buildContentSample() wants a window
 * from the middle, not just the front matter.
 */
const MAX_TEXT_PAGES = 40;

async function extractPdfText(buffer: Buffer, maxChars: number): Promise<string> {
  ensurePdfRuntimePolyfills();
  return queuePdfWork(() => readPdfText(buffer, maxChars));
}

async function readPdfText(buffer: Buffer, maxChars: number): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  try {
    const total = pdf.numPages;
    const stride = Math.max(1, Math.ceil(total / MAX_TEXT_PAGES));

    let text = "";
    for (let n = 1; n <= total && text.length < maxChars; n += stride) {
      const page = await pdf.getPage(n);
      try {
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => (typeof (item as { str?: unknown }).str === "string"
            ? (item as { str: string }).str
            : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (pageText) text += pageText + "\n\n";
      } finally {
        // Drop the page's operator list / text layer before moving on.
        page.cleanup();
      }
    }
    return text.slice(0, maxChars);
  } finally {
    await pdf.destroy();
  }
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
 * Build a representative sample from a book's full text for AI summarization.
 *
 * Naively slicing the first N characters mostly captures front-matter — the
 * title page, copyright, dedication and table of contents — which produces a
 * generic, content-free description. Instead we skip the likely front-matter
 * and blend a window from the start of the real content with a window from the
 * middle, so the model actually sees what the book is about.
 */
function buildContentSample(full: string, maxChars: number): string {
  const cleaned = full.replace(/[ \t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length <= maxChars) return cleaned;

  // Skip the first slice (title page / copyright / TOC), capped so short books
  // don't lose everything.
  const skip = Math.min(2500, Math.floor(cleaned.length * 0.04));
  const body = cleaned.slice(skip);

  const half = Math.floor(maxChars / 2);
  const start = body.slice(0, half);

  // A window from ~40% in, to capture core content rather than only the opening.
  const mid = Math.floor(body.length * 0.4);
  const middle = body.slice(mid, mid + (maxChars - half));

  return `${start}\n\n[…]\n\n${middle}`.slice(0, maxChars);
}

/**
 * Extract a plain-text content sample from a book file for downstream AI
 * summarization. Pulls a generous amount of raw text, then samples across the
 * document (see buildContentSample). Returns "" if nothing could be extracted.
 */
export async function extractBookText(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  maxChars = 20000
): Promise<string> {
  try {
    const type = fileType(filename, mimeType);
    // Read well beyond the sample size so we have real content to sample from.
    const rawCap = Math.max(maxChars * 4, 80000);
    let raw = "";
    if (type === "pdf") raw = await extractPdfText(buffer, rawCap);
    else if (type === "epub") raw = await extractEpubText(buffer, rawCap);
    else return "";
    return buildContentSample(raw, maxChars);
  } catch (err) {
    console.error("Book text extraction failed:", err);
    return "";
  }
}

/**
 * Fill a book's catalogue copy (description, key insights, category, tags,
 * and their French/English counterparts) from its own text, through the
 * grounded AI draft — every claim checked against the book.
 *
 * Server-only. Shared by the single-book admin action and the bulk run, so
 * both behave identically — including what they refuse to overwrite.
 */
import { prisma } from "./prisma";
import { draftListing, isAiEnrichConfigured } from "./ai-enrich";
import { catalogueCategories, draftSource } from "./book-analysis";
import { findAsset, readAsset } from "./asset-store";
import { sanitizeInput } from "./sanitize";

export type EnrichOutcome =
  | { status: "updated"; fields: string[] }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

/**
 * DOIs and similar permanent identifiers are the one thing in a hand-written
 * description that a generated one cannot reproduce, and losing them is not
 * recoverable from the book's text. Carry any across to the new description.
 */
const DOI_PATTERN = /\b10\.\d{4,9}\/[^\s"'<>,;)]+/g;

export function carryOverIdentifiers(
  previous: string,
  next: string
): string {
  const dois = [...new Set(previous.match(DOI_PATTERN) ?? [])];
  const missing = dois.filter((doi) => !next.includes(doi));
  if (missing.length === 0) return next;
  return `${next.trim()} ${missing.map((d) => `DOI ${d}`).join(" ")}`.trim();
}

/**
 * Enrich one book in place.
 *
 * `overwrite` controls the destructive part. Off (the default), existing key
 * insights, category and tags are left alone and only empty ones are filled;
 * the description is always rewritten, since every book here has a one-line
 * placeholder that "only fill empty fields" would never improve.
 */
export async function enrichBookById(
  bookId: string,
  { overwrite = false }: { overwrite?: boolean } = {}
): Promise<EnrichOutcome> {
  if (!isAiEnrichConfigured()) {
    return { status: "failed", reason: "AI drafting is not configured (set OPENAI_API_KEY)." };
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return { status: "failed", reason: "Book not found." };
  if (!book.fileId) {
    return { status: "skipped", reason: "No book file to read — upload a PDF or EPUB first." };
  }

  const asset = await findAsset(book.fileId);
  if (!asset) return { status: "skipped", reason: "The book's file is missing." };

  const [source, categories] = await Promise.all([draftSource(await readAsset(asset), asset.filename, asset.mimeType), catalogueCategories()]);
  if (!source.text.trim()) {
    return { status: "skipped", reason: "No readable text in the file (a scanned PDF?)." };
  }

  const ai = await draftListing({
    title: book.title,
    subtitle: book.subtitle ?? undefined,
    titleFr: book.titleFr ?? undefined,
    subtitleFr: book.subtitleFr ?? undefined,
    author: book.author,
    existingDescription: book.description,
    sampleText: source.text,
    language: source.language,
    categories,
  });
  if ("error" in ai) return { status: "failed", reason: ai.error };

  const data: Record<string, unknown> = {};
  const fields: string[] = [];
  const clean = (list: string[]) => list.map((i) => sanitizeInput(i));

  if (ai.description) {
    data.description = sanitizeInput(carryOverIdentifiers(book.description, ai.description));
    fields.push("description");
  }
  if (ai.descriptionFr && (overwrite || !book.descriptionFr)) {
    data.descriptionFr = sanitizeInput(ai.descriptionFr);
    fields.push("description (FR)");
  }
  if (ai.keyInsights?.length && (overwrite || book.keyInsights.length === 0)) {
    data.keyInsights = clean(ai.keyInsights);
    fields.push("key insights");
  }
  if (ai.keyInsightsFr?.length && (overwrite || book.keyInsightsFr.length === 0)) {
    data.keyInsightsFr = clean(ai.keyInsightsFr);
    fields.push("key insights (FR)");
  }
  if (ai.titleFr && !book.titleFr) {
    data.titleFr = sanitizeInput(ai.titleFr);
    fields.push("title (FR)");
  }
  if (ai.subtitleFr && !book.subtitleFr) {
    data.subtitleFr = sanitizeInput(ai.subtitleFr);
    fields.push("subtitle (FR)");
  }
  if (ai.category && (overwrite || !book.category)) {
    data.category = sanitizeInput(ai.category);
    fields.push("category");
  }
  if (ai.tags?.length && (overwrite || book.tags.length === 0)) {
    data.tags = clean(ai.tags);
    fields.push("tags");
  }
  const removed = ai.report.removedSentences.length + ai.report.droppedInsights.length;
  if (removed && fields.length) fields.push(`${removed} unsupported statement${removed === 1 ? "" : "s"} removed`);

  if (fields.length === 0) {
    return { status: "skipped", reason: "Nothing new to add." };
  }

  await prisma.book.update({ where: { id: bookId }, data });
  return { status: "updated", fields };
}

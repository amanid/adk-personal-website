/**
 * Fill a book's catalogue copy (description, key insights, category, tags)
 * from its own text using the AI enricher.
 *
 * Server-only. Shared by the single-book admin action and the bulk run, so
 * both behave identically — including what they refuse to overwrite.
 */
import { prisma } from "./prisma";
import { extractBookText } from "./book-parser";
import { enrichBookMetadata, isAiEnrichConfigured } from "./ai-enrich";
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

  const asset = await prisma.bookAsset.findUnique({ where: { id: book.fileId } });
  if (!asset) return { status: "skipped", reason: "The book's file is missing." };

  const sampleText = await extractBookText(
    Buffer.from(asset.data),
    asset.filename,
    asset.mimeType
  );
  if (!sampleText.trim()) {
    return { status: "skipped", reason: "No readable text in the file (a scanned PDF?)." };
  }

  const ai = await enrichBookMetadata({
    title: book.title,
    author: book.author,
    existingDescription: book.description,
    sampleText,
  });
  if (!ai) return { status: "failed", reason: "The AI returned nothing usable." };

  const data: Record<string, unknown> = {};
  const fields: string[] = [];

  if (ai.description) {
    data.description = sanitizeInput(carryOverIdentifiers(book.description, ai.description));
    fields.push("description");
  }
  if (ai.keyInsights.length && (overwrite || book.keyInsights.length === 0)) {
    data.keyInsights = ai.keyInsights.map((i) => sanitizeInput(i));
    fields.push("key insights");
  }
  if (ai.category && (overwrite || !book.category)) {
    data.category = sanitizeInput(ai.category);
    fields.push("category");
  }
  if (ai.tags?.length && (overwrite || book.tags.length === 0)) {
    data.tags = ai.tags.map((t) => sanitizeInput(t));
    fields.push("tags");
  }

  if (fields.length === 0) {
    return { status: "skipped", reason: "Nothing new to add." };
  }

  await prisma.book.update({ where: { id: bookId }, data });
  return { status: "updated", fields };
}

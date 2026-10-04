/**
 * Server-side glue between stored book files and the extraction libraries:
 * store a cover found in a file, get a text sample for drafting, list the
 * catalogue's categories. Shared by the editor's routes, bulk import and the
 * per-book enrich run, so they all behave the same.
 */
import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { coverFromDocumentImage } from "./cover-image";
import { analyseDocument, docKind, type RawCover } from "./doc-facts";
import { extractBookText } from "./book-parser";
import { detectLanguage } from "./lang-detect";

export interface StoredCover {
  coverImageId: string;
  source: string;
  width: number;
  height: number;
  /** Set when the image is usable but small. */
  note?: string;
}

/** Validate, downscale and save a cover found in a document. */
export async function storeDocumentCover(raw: RawCover): Promise<StoredCover | { refused: string }> {
  const c = await coverFromDocumentImage(raw.data);
  if ("refused" in c) return { refused: `${raw.source}: ${c.refused}` };
  const upload = await prisma.upload.create({
    data: { filename: `${randomUUID()}-cover.jpg`, mimeType: c.image.mimeType, data: Buffer.from(c.image.data) },
  });
  return {
    coverImageId: upload.id,
    source: raw.source,
    width: c.width,
    height: c.height,
    note: c.width < 400 ? `The cover found in the file is only ${c.width}×${c.height} pixels; a larger image would look sharper.` : undefined,
  };
}

/** A text sample spanning the document, plus its language, for the AI draft. */
export async function draftSource(data: Uint8Array, filename: string, mimeType: string): Promise<{ text: string; language?: string }> {
  const kind = docKind(filename, mimeType);
  let text = "";
  if (kind === "pdf" || kind === "epub") text = await extractBookText(Buffer.from(data.buffer, data.byteOffset, data.byteLength), filename, mimeType);
  else if (kind === "docx" || kind === "pptx") text = (await analyseDocument(data, filename, mimeType)).text.slice(0, 20000);
  return { text, language: detectLanguage(text)?.language };
}

/** Categories already used in the catalogue, most used first. */
export async function catalogueCategories(): Promise<string[]> {
  const [books, pubs] = await Promise.all([
    prisma.book.groupBy({ by: ["category"], _count: { _all: true }, where: { category: { not: null } } }),
    prisma.publication.groupBy({ by: ["category"], _count: { _all: true }, where: { category: { not: null } } }),
  ]);
  const counts = new Map<string, number>();
  for (const r of [...books, ...pubs]) if (r.category?.trim()) counts.set(r.category.trim(), (counts.get(r.category.trim()) ?? 0) + r._count._all);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

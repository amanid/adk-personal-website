/**
 * Cover-image processing for the bookstore.
 *
 * Goals:
 *  - Keep covers SMALL in the database (bytes are served straight from Postgres
 *    into the Node process; large covers cause heap spikes / OOM restarts).
 *  - Extract a real cover from a PDF's first page.
 *
 * All functions are best-effort and return null on failure so ingest never
 * breaks because of an image issue.
 */
import sharp from "sharp";
import { renderPageAsImage } from "unpdf";
import { ensurePdfRuntimePolyfills, queuePdfWork } from "./pdf-runtime";

const MAX_COVER_WIDTH = 640; // plenty for a store cover; keeps files ~20-80KB
const JPEG_QUALITY = 82;

// Above this size we skip PDF rasterization / text extraction to protect memory
// (pdfjs loads the whole document into the heap).
export const MAX_PDF_PROCESS_BYTES = 35 * 1024 * 1024;

export interface ProcessedImage {
  data: Buffer;
  mimeType: string;
}

/** Downscale + re-encode an image to a small JPEG suitable for a store cover. */
export async function processCoverImage(
  input: Buffer | Uint8Array
): Promise<ProcessedImage | null> {
  try {
    const data = await sharp(input)
      .rotate() // respect EXIF orientation
      .resize({ width: MAX_COVER_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    return { data, mimeType: "image/jpeg" };
  } catch (err) {
    console.error("Cover image processing failed:", err);
    return null;
  }
}

/**
 * Render a PDF's first page to a small JPEG cover. Returns null on any failure.
 *
 * `scale` trades resolution for peak memory; the default is fine for an admin
 * upload, while callers on the public path should pass something lower.
 */
export async function renderPdfCover(
  pdf: Buffer,
  { scale = 1.5 }: { scale?: number } = {}
): Promise<ProcessedImage | null> {
  if (pdf.length > MAX_PDF_PROCESS_BYTES) return null;
  ensurePdfRuntimePolyfills();
  try {
    const raster = await queuePdfWork(() =>
      renderPageAsImage(new Uint8Array(pdf), 1, {
        scale,
        canvasImport: () => import("@napi-rs/canvas"),
      })
    );
    return await processCoverImage(Buffer.from(raster));
  } catch (err) {
    console.error("PDF cover render failed:", err);
    return null;
  }
}

/** A page that renders as one flat colour (a blank first page) is no cover. */
export async function isBlankImage(input: ArrayBuffer | Uint8Array): Promise<boolean> {
  try {
    const { channels } = await sharp(input instanceof Uint8Array ? input : new Uint8Array(input)).stats();
    return channels.slice(0, 3).every((c) => c.stdev < 3);
  } catch {
    return true;
  }
}

/**
 * Turn an image found in a document into a store cover, or explain why not.
 * Anything sharp can't decode, or too small to show, is refused.
 */
export async function coverFromDocumentImage(
  input: Uint8Array
): Promise<{ image: ProcessedImage; width: number; height: number } | { refused: string }> {
  try {
    const meta = await sharp(input).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width < 120 || height < 120) return { refused: `the image is only ${width}×${height} pixels` };
    if (await isBlankImage(input)) return { refused: "the image is blank" };
    const image = await processCoverImage(input);
    return image ? { image, width, height } : { refused: "the image could not be converted" };
  } catch {
    return { refused: "the image format could not be read" };
  }
}

/** True for raster image mime types we can process/serve inline. */
export function isProcessableImage(mimeType: string): boolean {
  return /^image\/(jpeg|png|webp|gif|avif|tiff)$/.test(mimeType);
}

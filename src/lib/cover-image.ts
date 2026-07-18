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

/** Render a PDF's first page to a small JPEG cover. Returns null on any failure. */
export async function renderPdfCover(pdf: Buffer): Promise<ProcessedImage | null> {
  if (pdf.length > MAX_PDF_PROCESS_BYTES) return null;
  try {
    const raster = await renderPageAsImage(new Uint8Array(pdf), 1, {
      scale: 1.5,
      canvasImport: () => import("@napi-rs/canvas"),
    });
    return await processCoverImage(Buffer.from(raster));
  } catch (err) {
    console.error("PDF cover render failed:", err);
    return null;
  }
}

/** True for raster image mime types we can process/serve inline. */
export function isProcessableImage(mimeType: string): boolean {
  return /^image\/(jpeg|png|webp|gif|avif|tiff)$/.test(mimeType);
}

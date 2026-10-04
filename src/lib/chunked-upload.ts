/**
 * Browser side of the piecewise book-file upload (see src/lib/asset-store.ts
 * and /api/admin/books/upload). Each 4MB piece is its own request, retried on
 * failure; the server accepts the file only when its stored bytes hash to the
 * SHA-256 computed here from the original.
 */
import { readJson } from "./api-response";

export interface UploadedFile {
  fileId: string;
  fileName: string;
  fileMimeType: string;
  size: number;
  analysable: boolean;
  aiAvailable: boolean;
}

const RETRIES = 3;

async function sha256Hex(file: File): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("This browser can't verify the upload (needs a secure https page).");
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendPart(fileId: string, index: number, blob: Blob): Promise<void> {
  let lastError = "network error";
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(`/api/admin/books/upload/${fileId}?part=${index}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: blob,
      });
    } catch {
      lastError = "the connection dropped";
    }
    if (res?.ok) return;
    if (res) {
      const message = (await res.json().catch(() => ({}))).error || `HTTP ${res.status}`;
      // Arrived incomplete (400) or a server hiccup (5xx): worth another try.
      // Anything else (signed out, upload gone) won't improve by retrying.
      if (res.status !== 400 && res.status < 500) throw new Error(message);
      lastError = message;
    }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  throw new Error(`Piece ${index + 1} could not be sent after ${RETRIES} tries (${lastError}). Check your connection and try again.`);
}

/**
 * Upload `file` in pieces. `onProgress` gets a fraction from 0 to 1 and a
 * short label for the current step.
 */
export async function uploadInPieces(file: File, onProgress?: (fraction: number, step: string) => void): Promise<UploadedFile> {
  onProgress?.(0, "Checking the file…");
  const sha256 = await sha256Hex(file);

  const start = await readJson<{ fileId: string; partSize: number; parts: number }>(
    await fetch("/api/admin/books/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, size: file.size }),
    }),
    "Upload failed"
  );

  const send = async (indices: number[]) => {
    for (const [n, index] of indices.entries()) {
      onProgress?.((n + 0.5) / indices.length, `Uploading piece ${n + 1} of ${indices.length}…`);
      await sendPart(start.fileId, index, file.slice(index * start.partSize, (index + 1) * start.partSize));
    }
  };
  await send(Array.from({ length: start.parts }, (_, i) => i));

  const finish = () =>
    fetch(`/api/admin/books/upload/${start.fileId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha256, fileName: file.name }),
    });
  onProgress?.(1, "Verifying the stored file…");
  let res = await finish();
  if (res.status === 409) {
    // Some piece went missing in transit: send those again, once.
    const missing = ((await res.clone().json().catch(() => ({}))).missing ?? []) as number[];
    if (missing.length) {
      await send(missing);
      res = await finish();
    }
  }
  return readJson<UploadedFile>(res, "Upload failed");
}

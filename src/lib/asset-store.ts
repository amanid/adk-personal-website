/**
 * Storage for book files, in 4MB pieces.
 *
 * The site runs on a small instance (512MB). Handling a whole upload in one
 * request costs about fourteen times the file's size in memory — the
 * middleware's buffered copy, the parsed form, and Prisma's encoding of one
 * big binary value — so anything over ~10MB ran out of memory. Instead the
 * browser sends the file in pieces, each piece is its own row, and downloads
 * stream the rows back one at a time. Files stored whole before this keep
 * working: `parts` is 0 for them and the bytes are in `BookAsset.data`.
 */
import { createHash } from "crypto";
import { prisma } from "./prisma";

export const PART_SIZE = 4 * 1024 * 1024;
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Metadata only: never loads the bytes of an older, whole-stored file. */
export const ASSET_META = { id: true, filename: true, mimeType: true, size: true, parts: true, complete: true, createdAt: true } as const;

export type AssetMeta = { id: string; filename: string; mimeType: string; size: number; parts: number; complete: boolean };

export const expectedParts = (size: number) => Math.max(1, Math.ceil(size / PART_SIZE));

/** Exact length piece `index` must have for a file of `size` bytes. */
export function partLength(size: number, index: number): number {
  const count = expectedParts(size);
  if (index < 0 || index >= count) return -1;
  return index === count - 1 ? size - PART_SIZE * (count - 1) : PART_SIZE;
}

/** A complete file's metadata, or null (missing, or upload unfinished). */
export async function findAsset(id: string): Promise<AssetMeta | null> {
  const a = await prisma.bookAsset.findUnique({ where: { id }, select: ASSET_META });
  return a && a.complete ? a : null;
}

/** The whole file in one buffer (for reading its contents: facts, cover, text). */
export async function readAsset(asset: AssetMeta): Promise<Buffer> {
  if (asset.parts === 0) {
    const row = await prisma.bookAsset.findUnique({ where: { id: asset.id }, select: { data: true } });
    if (!row?.data) throw new Error("The stored file has no data");
    return Buffer.from(row.data.buffer, row.data.byteOffset, row.data.byteLength);
  }
  // One allocation for the file; pieces are copied in one at a time.
  const out = Buffer.allocUnsafe(asset.size);
  let offset = 0;
  for (let index = 0; index < asset.parts; index++) {
    const part = await prisma.bookAssetPart.findUnique({ where: { assetId_index: { assetId: asset.id, index } }, select: { data: true } });
    if (!part) throw new Error(`Piece ${index + 1} of the stored file is missing`);
    out.set(part.data, offset);
    offset += part.data.byteLength;
  }
  if (offset !== asset.size) throw new Error("The stored file is incomplete");
  return out;
}

/** Stream the file for download, holding one piece in memory at a time. */
export function streamAsset(asset: AssetMeta): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (asset.parts === 0) {
          const row = await prisma.bookAsset.findUnique({ where: { id: asset.id }, select: { data: true } });
          if (row?.data) controller.enqueue(new Uint8Array(row.data));
          controller.close();
          return;
        }
        if (index >= asset.parts) {
          controller.close();
          return;
        }
        const part = await prisma.bookAssetPart.findUnique({ where: { assetId_index: { assetId: asset.id, index } }, select: { data: true } });
        if (!part) throw new Error(`Piece ${index + 1} missing`);
        controller.enqueue(new Uint8Array(part.data));
        index++;
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/** SHA-256 of a stored file, computed piece by piece. */
export async function hashAsset(asset: AssetMeta): Promise<string> {
  const hash = createHash("sha256");
  if (asset.parts === 0) {
    hash.update(await readAsset(asset));
    return hash.digest("hex");
  }
  for (let index = 0; index < asset.parts; index++) {
    const part = await prisma.bookAssetPart.findUnique({ where: { assetId_index: { assetId: asset.id, index } }, select: { data: true } });
    if (!part) throw new Error(`Piece ${index + 1} missing`);
    hash.update(part.data);
  }
  return hash.digest("hex");
}

/** Remove uploads that were started but never finished (run by the cron tick). */
export async function purgeAbandonedUploads(olderThanHours = 24): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 3600_000);
  const { count } = await prisma.bookAsset.deleteMany({ where: { complete: false, createdAt: { lt: cutoff } } });
  return count;
}

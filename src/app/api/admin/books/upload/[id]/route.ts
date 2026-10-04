import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { ASSET_META, hashAsset, partLength } from "@/lib/asset-store";
import { isAiEnrichConfigured } from "@/lib/ai-enrich";
import { docKind } from "@/lib/doc-facts";

export const runtime = "nodejs";
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

async function pendingAsset(id: string) {
  return prisma.bookAsset.findUnique({ where: { id }, select: ASSET_META });
}

/** Store one 4MB piece: PUT ?part=n with the raw bytes as the body. Safe to retry. */
export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const index = Number(new URL(request.url).searchParams.get("part"));
    const asset = await pendingAsset(id);
    if (!asset) return NextResponse.json({ error: "Upload not found — start it again." }, { status: 404 });
    if (asset.complete) return NextResponse.json({ error: "This upload is already finished." }, { status: 409 });
    const expected = Number.isInteger(index) ? partLength(asset.size, index) : -1;
    if (expected < 0) return NextResponse.json({ error: "Invalid piece number" }, { status: 400 });

    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength !== expected) {
      return NextResponse.json({ error: `Piece ${index + 1} arrived incomplete (${bytes.byteLength} of ${expected} bytes). Retrying…` }, { status: 400 });
    }
    await prisma.bookAssetPart.upsert({
      where: { assetId_index: { assetId: id, index } },
      update: { data: bytes },
      create: { assetId: id, index, data: bytes },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Book upload piece error:", error);
    return NextResponse.json({ error: "A piece of the file could not be stored. Retrying…" }, { status: 500 });
  }
}

/**
 * Finish the upload: every piece must be present with its exact length, and
 * the stored bytes must hash to the SHA-256 the browser computed from the
 * original file. Only then is the file usable.
 */
export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const sha256 = typeof body?.sha256 === "string" ? body.sha256.toLowerCase() : "";
    const fileName = typeof body?.fileName === "string" ? body.fileName.slice(0, 255) : "";
    const asset = await pendingAsset(id);
    if (!asset) return NextResponse.json({ error: "Upload not found — start it again." }, { status: 404 });

    if (!asset.complete) {
      const parts = await prisma.bookAssetPart.findMany({ where: { assetId: id }, select: { index: true } });
      const have = new Set(parts.map((p) => p.index));
      const missing = Array.from({ length: asset.parts }, (_, i) => i).filter((i) => !have.has(i));
      if (missing.length) {
        return NextResponse.json({ error: `The upload is missing piece(s) ${missing.map((i) => i + 1).join(", ")}.`, missing }, { status: 409 });
      }
      const stored = await hashAsset(asset);
      if (!/^[0-9a-f]{64}$/.test(sha256) || stored !== sha256) {
        await prisma.bookAsset.delete({ where: { id } });
        return NextResponse.json({ error: "The stored file doesn't match the original (checksum mismatch). Upload it again." }, { status: 422 });
      }
      await prisma.bookAsset.update({ where: { id }, data: { complete: true } });
    }

    return NextResponse.json({
      fileId: asset.id,
      fileName: fileName || asset.filename,
      fileMimeType: asset.mimeType,
      size: asset.size,
      sha256,
      analysable: docKind(asset.filename, asset.mimeType) !== "other",
      aiAvailable: isAiEnrichConfigured(),
    });
  } catch (error) {
    console.error("Book upload finish error:", error);
    return NextResponse.json({ error: "The upload could not be finished. Try again." }, { status: 500 });
  }
}

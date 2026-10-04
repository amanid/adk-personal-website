import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findAsset, streamAsset } from "@/lib/asset-store";
import { apiError, apiOptions, authenticateApi } from "@/lib/data-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const OPTIONS = apiOptions;

/** GET /api/v1/datasets/{slug}/download — the dataset file (Pro plan). */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await authenticateApi(request);
  if (ctx instanceof Response) return ctx;
  if (ctx.plan !== "PRO") {
    return apiError(403, "plan_required", "Dataset downloads are included in the Pro plan. Upgrade from your key page, or buy the dataset in the store.");
  }
  const { slug } = await params;
  const b = await prisma.book.findFirst({ where: { slug, kind: "DATASET", status: "PUBLISHED" }, select: { fileId: true, fileName: true, slug: true } });
  if (!b?.fileId) return apiError(404, "not_found", "No dataset with that slug.");
  const asset = await findAsset(b.fileId);
  if (!asset) return apiError(404, "not_found", "No dataset with that slug.");
  const name = (b.fileName || asset.filename).replace(/[^\w.\- ]/g, "_");
  return new NextResponse(streamAsset(asset), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": String(asset.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

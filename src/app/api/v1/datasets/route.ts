import { prisma } from "@/lib/prisma";
import { apiJson, apiOptions, authenticateApi } from "@/lib/data-api";
import { serializeDataset } from "@/lib/data-api-serialize";

export const dynamic = "force-dynamic";
export const OPTIONS = apiOptions;

/** GET /api/v1/datasets — published datasets (metadata; downloads need Pro). */
export async function GET(request: Request) {
  const ctx = await authenticateApi(request);
  if (ctx instanceof Response) return ctx;
  const rows = await prisma.book.findMany({
    where: { kind: "DATASET", status: "PUBLISHED", fileId: { not: null } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  const sizes = new Map(
    (await prisma.bookAsset.findMany({ where: { id: { in: rows.map((r) => r.fileId!) } }, select: { id: true, size: true } })).map((a) => [a.id, a.size])
  );
  return apiJson(ctx, { data: rows.map((r) => serializeDataset(r, sizes.get(r.fileId!) ?? null)), plan: ctx.plan });
}

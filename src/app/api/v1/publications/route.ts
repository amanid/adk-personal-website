import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiJson, apiOptions, authenticateApi } from "@/lib/data-api";
import { serializePublication } from "@/lib/data-api-serialize";

export const dynamic = "force-dynamic";
export const OPTIONS = apiOptions;

/** GET /api/v1/publications?q=&category=&year=&type=&page=&per_page= */
export async function GET(request: Request) {
  const ctx = await authenticateApi(request);
  if (ctx instanceof Response) return ctx;
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, Math.min(1000, Number.parseInt(sp.get("page") || "1", 10) || 1));
  const perPage = Math.max(1, Math.min(100, Number.parseInt(sp.get("per_page") || "20", 10) || 20));
  const q = (sp.get("q") || "").trim().slice(0, 100);
  const year = Number.parseInt(sp.get("year") || "", 10);
  const where: Prisma.PublicationWhereInput = {
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { abstract: { contains: q, mode: "insensitive" } }, { tags: { has: q } }] } : {}),
    ...(sp.get("category") ? { category: sp.get("category")!.slice(0, 100) } : {}),
    ...(Number.isFinite(year) ? { year } : {}),
    ...(sp.get("type") ? { publicationType: sp.get("type")!.toUpperCase() as Prisma.PublicationWhereInput["publicationType"] } : {}),
  };
  try {
    const [total, rows] = await Promise.all([
      prisma.publication.count({ where }),
      prisma.publication.findMany({ where, orderBy: [{ year: "desc" }, { createdAt: "desc" }], skip: (page - 1) * perPage, take: perPage }),
    ]);
    return apiJson(ctx, { data: rows.map(serializePublication), page, per_page: perPage, total });
  } catch {
    // e.g. an unknown `type` value
    return apiJson(ctx, { error: { code: "bad_request", message: "Invalid filter." } }, { status: 400 });
  }
}

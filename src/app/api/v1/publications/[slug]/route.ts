import { prisma } from "@/lib/prisma";
import { apiError, apiJson, apiOptions, authenticateApi } from "@/lib/data-api";
import { serializePublication } from "@/lib/data-api-serialize";

export const dynamic = "force-dynamic";
export const OPTIONS = apiOptions;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await authenticateApi(request);
  if (ctx instanceof Response) return ctx;
  const { slug } = await params;
  const p = await prisma.publication.findUnique({ where: { slug } });
  if (!p) return apiError(404, "not_found", "No publication with that slug.");
  return apiJson(ctx, { data: serializePublication(p) });
}

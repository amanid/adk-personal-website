import { apiJson, apiOptions, authenticateApi, currentPeriod } from "@/lib/data-api";

export const dynamic = "force-dynamic";
export const OPTIONS = apiOptions;

/** GET /api/v1/usage — this key's plan and quota for the current month. */
export async function GET(request: Request) {
  const ctx = await authenticateApi(request);
  if (ctx instanceof Response) return ctx;
  return apiJson(ctx, {
    data: { plan: ctx.plan, period: currentPeriod(), used: ctx.used, quota: ctx.quota, remaining: Math.max(0, ctx.quota - ctx.used) },
  });
}

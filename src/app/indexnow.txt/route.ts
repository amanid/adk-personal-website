import { getIndexNowKey } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

/** The IndexNow ownership key (see src/lib/indexnow.ts). */
export async function GET() {
  return new Response(await getIndexNowKey(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}

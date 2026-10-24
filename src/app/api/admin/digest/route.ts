import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { buildDigest, getDigestStatus, renderDigest, sendDigest, setDigestEnabled } from "@/lib/digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: status and this month's content; `?preview=1` returns the email as HTML. */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(request.url);
  const content = await buildDigest();
  if (url.searchParams.get("preview") === "1") {
    return new NextResponse(renderDigest(content, "#unsubscribe-link", "there"), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }
  return NextResponse.json({ status: await getDigestStatus(), content });
}

/** PUT { enabled }: switch the monthly send on or off. */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = z.object({ enabled: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await setDigestEnabled(parsed.data.enabled);
  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
}

/** POST { force? }: send now. Without `force`, a month already sent is refused. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = z.object({ force: z.boolean().optional() }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const result = await sendDigest(new Date(), { force: parsed.data.force === true });
  if (result.skipped === "already sent this month") return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result);
}

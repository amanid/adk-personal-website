import { prisma } from "@/lib/prisma";
import { verifyOptOut } from "@/lib/sales-emails";
import { escapeHtml } from "@/lib/html";

export const runtime = "nodejs";

/** One-click opt-out from sales emails (signed link, no login). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = verifyOptOut(url.searchParams.get("e") || "", url.searchParams.get("t") || "");
  const page = (msg: string) =>
    new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Email preferences</title></head><body style="margin:0;background:#111110;color:#edeae3;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh"><p style="max-width:28rem;padding:1.5rem;text-align:center;line-height:1.6">${msg}</p></body></html>`,
      { status: email ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
    );
  if (!email) return page("This link isn't valid.");
  await prisma.emailOptOut.upsert({ where: { email }, update: {}, create: { email } });
  return page(`Done — <strong>${escapeHtml(email)}</strong> won't receive order reminders or recommendations any more. Receipts and download links are still sent.`);
}

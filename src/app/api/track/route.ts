import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Anonymous, unauthenticated writes into a small database: every field is
// bounded and each client is throttled, so a loop of POSTs can't fill it.
const MAX_BODY_BYTES = 4096;
const clip = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);

function parseUserAgent(ua: string) {
  let device = "desktop";
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
  }

  let browser = "other";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/opera|opr\//i.test(ua)) browser = "Opera";

  let os = "other";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";

  return { device, browser, os };
}

export async function POST(request: NextRequest) {
  try {
    // Silently drop (still 200, so the beacon never retries) anything abusive.
    if (rateLimit(request, { limit: 60, windowSeconds: 60 })) return NextResponse.json({ ok: true });
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return NextResponse.json({ ok: true });

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ ok: true });
    const body = JSON.parse(raw);
    const path = clip(body?.path, 512);
    const referrer = clip(body?.referrer, 1024);

    if (!path || !path.startsWith("/")) {
      return NextResponse.json({ ok: true });
    }

    const sessionId = clip(body?.visitorId, 64);

    const userAgent = (request.headers.get("user-agent") || "").slice(0, 512);
    const { device, browser, os } = parseUserAgent(userAgent);

    // Cloudflare sets cf-ipcountry on every request; the x-vercel-* headers
    // the code used to prefer are only trustworthy on Vercel, and here a
    // visitor could send any value in them.
    const country = clip(request.headers.get("cf-ipcountry"), 8);
    const city = null;

    await prisma.pageView.create({
      data: {
        path,
        referrer,
        userAgent: userAgent || null,
        country,
        city,
        device,
        browser,
        os,
        sessionId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

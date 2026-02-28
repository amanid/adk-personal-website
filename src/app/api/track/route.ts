import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await request.json();
    const { path, referrer } = body;

    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: true });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const { device, browser, os } = parseUserAgent(userAgent);

    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;

    const city = request.headers.get("x-vercel-ip-city") || null;

    await prisma.pageView.create({
      data: {
        path,
        referrer: referrer || null,
        userAgent: userAgent || null,
        country,
        city,
        device,
        browser,
        os,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

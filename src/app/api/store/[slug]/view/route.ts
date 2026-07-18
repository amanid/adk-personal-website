import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Records a book detail-page view. Kept out of the page render so the detail
 * page itself can be statically cached (revalidated) instead of force-dynamic.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = rateLimit(request, { limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const { slug } = await params;
    await prisma.book.updateMany({
      where: { slug, status: "PUBLISHED" },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Non-critical — never surface errors to the visitor.
    return NextResponse.json({ ok: false });
  }
}

import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { notifySubscribers } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Email confirmed newsletter subscribers about a published product. Sent at
 * most once per product (claimed atomically), and in the background so the
 * admin isn't kept waiting on a long mailing.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const claimed = await prisma.book.updateMany({
    where: { id, status: "PUBLISHED", announcedAt: null },
    data: { announcedAt: new Date() },
  });
  if (claimed.count === 0) {
    return NextResponse.json({ error: "Only a published product can be announced, and only once." }, { status: 409 });
  }
  const book = await prisma.book.findUniqueOrThrow({ where: { id } });
  const subscribers = await prisma.subscriber.count({ where: { confirmed: true } });
  after(() =>
    notifySubscribers({
      type: "product",
      title: book.title,
      excerpt: (book.keyInsights[0] || book.description).slice(0, 220),
      url: `/en/store/${book.slug}`,
    }).catch((e) => console.error("Product announcement failed:", e))
  );
  return NextResponse.json({ message: `Announcing to ${subscribers} confirmed subscriber(s).` });
}

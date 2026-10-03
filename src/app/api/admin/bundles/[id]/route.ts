import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { bundleSchema } from "@/lib/validations";
import { checkBundleBooks } from "@/lib/bundle-admin";
import { sanitizeInput } from "@/lib/sanitize";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const parsed = bundleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const problem = await checkBundleBooks(d);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  const exists = await prisma.bundle.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Past buyers keep their downloads: grants are per product and were
  // created at purchase, so changing the contents only affects new sales.
  const bundle = await prisma.$transaction(async (tx) => {
    await tx.bundleItem.deleteMany({ where: { bundleId: id } });
    return tx.bundle.update({
      where: { id },
      data: {
        title: sanitizeInput(d.title),
        titleFr: d.titleFr ? sanitizeInput(d.titleFr) : null,
        description: sanitizeInput(d.description),
        descriptionFr: d.descriptionFr ? sanitizeInput(d.descriptionFr) : null,
        priceCents: d.priceCents,
        currency: d.currency,
        coverImageId: d.coverImageId || null,
        status: d.status,
        featured: d.featured ?? false,
        sortOrder: d.sortOrder ?? 0,
        items: { create: [...new Set(d.bookIds)].map((bookId) => ({ bookId })) },
      },
    });
  });
  return NextResponse.json({ bundle });
}

/** Delete an unsold bundle; a sold one is archived instead, keeping order history. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const sold = await prisma.orderItem.count({ where: { bundleId: id } });
  if (sold > 0) {
    await prisma.bundle.update({ where: { id }, data: { status: "ARCHIVED" } }).catch(() => null);
    return NextResponse.json({ archived: true, message: "This bundle has been sold, so it was archived instead." });
  }
  await prisma.bundle.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

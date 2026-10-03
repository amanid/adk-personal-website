import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { announceChange } from "@/lib/indexnow";
import { requireAdmin } from "@/lib/admin-guard";
import { bundleSchema } from "@/lib/validations";
import { checkBundleBooks } from "@/lib/bundle-admin";
import { sanitizeInput } from "@/lib/sanitize";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [bundles, books] = await Promise.all([
    prisma.bundle.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { items: { select: { bookId: true } }, _count: { select: { orderItems: true } } },
    }),
    prisma.book.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { title: "asc" },
      select: {
        id: true, title: true, kind: true, status: true, currency: true, priceCents: true,
        salePriceCents: true, saleStartsAt: true, saleEndsAt: true, payWhatYouWant: true,
      },
    }),
  ]);
  return NextResponse.json({ bundles, books });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = bundleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const problem = await checkBundleBooks(d);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const base = slugify(d.title) || "bundle";
  let slug = base;
  for (let i = 2; await prisma.bundle.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  const bundle = await prisma.bundle.create({
    data: {
      slug,
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
  if (bundle.status === "PUBLISHED") announceChange(`/store/bundles/${bundle.slug}`);
  return NextResponse.json({ bundle }, { status: 201 });
}

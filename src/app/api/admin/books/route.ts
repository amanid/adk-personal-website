import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookSchema } from "@/lib/validations";
import { sanitizeInput } from "@/lib/sanitize";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const books = await prisma.book.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    // Per-book performance from PAID orders + download activity.
    const paidItems = await prisma.orderItem.findMany({
      where: { order: { status: "PAID" } },
      select: { bookId: true, quantity: true, unitPriceCents: true },
    });
    const grants = await prisma.downloadGrant.groupBy({
      by: ["bookId"],
      _sum: { downloadCount: true },
    });

    const soldByBook = new Map<string, { units: number; revenueCents: number }>();
    for (const it of paidItems) {
      const prev = soldByBook.get(it.bookId) || { units: 0, revenueCents: 0 };
      prev.units += it.quantity;
      prev.revenueCents += it.unitPriceCents * it.quantity;
      soldByBook.set(it.bookId, prev);
    }
    const downloadsByBook = new Map(
      grants.map((g) => [g.bookId, g._sum.downloadCount || 0])
    );

    const withStats = books.map((b) => ({
      ...b,
      stats: {
        views: b.views,
        unitsSold: soldByBook.get(b.id)?.units || 0,
        revenueCents: soldByBook.get(b.id)?.revenueCents || 0,
        downloads: downloadsByBook.get(b.id) || 0,
      },
    }));

    return NextResponse.json({ books: withStats });
  } catch (error) {
    console.error("Admin books fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = bookSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    const data = validation.data;

    const base = slugify(data.title) || "book";
    let slug = base;
    let counter = 1;
    while (await prisma.book.findUnique({ where: { slug } })) {
      slug = `${base}-${counter++}`;
    }

    const book = await prisma.book.create({
      data: {
        title: sanitizeInput(data.title),
        titleFr: data.titleFr ? sanitizeInput(data.titleFr) : null,
        slug,
        subtitle: data.subtitle ? sanitizeInput(data.subtitle) : null,
        subtitleFr: data.subtitleFr ? sanitizeInput(data.subtitleFr) : null,
        description: data.description,
        descriptionFr: data.descriptionFr || null,
        keyInsights: (data.keyInsights || []).map(sanitizeInput),
        keyInsightsFr: (data.keyInsightsFr || []).map(sanitizeInput),
        author: data.author ? sanitizeInput(data.author) : undefined,
        publicationYear: data.publicationYear,
        isbn: data.isbn ? sanitizeInput(data.isbn) : null,
        language: data.language ? sanitizeInput(data.language) : undefined,
        pageCount: data.pageCount ?? null,
        category: data.category ? sanitizeInput(data.category) : null,
        tags: (data.tags || []).map(sanitizeInput),
        priceCents: data.priceCents,
        currency: data.currency || "USD",
        coverImageId: data.coverImageId || null,
        fileId: data.fileId || null,
        fileName: data.fileName ? sanitizeInput(data.fileName) : null,
        fileMimeType: data.fileMimeType || null,
        status: data.status || "DRAFT",
        featured: data.featured || false,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error("Book create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

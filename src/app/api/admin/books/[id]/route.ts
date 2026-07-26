import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookSchema } from "@/lib/validations";
import { sanitizeInput } from "@/lib/sanitize";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return false;
  }
  return true;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ book });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = bookSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    const data = validation.data;

    const book = await prisma.book.update({
      where: { id },
      data: {
        title: sanitizeInput(data.title),
        titleFr: data.titleFr ? sanitizeInput(data.titleFr) : null,
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

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Book update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const force = new URL(request.url).searchParams.get("force") === "true";

    const book = await prisma.book.findUnique({
      where: { id },
      select: { id: true, fileId: true, coverImageId: true },
    });
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sold = await prisma.orderItem.count({ where: { bookId: id } });

    // A book with order history can't be simply deleted — that would break the
    // buyers' receipts and download links. Default: refuse and suggest Archive.
    // With ?force=true the admin explicitly removes it and its order lines/grants.
    if (sold > 0 && !force) {
      return NextResponse.json(
        {
          error: `This book appears in ${sold} order${sold === 1 ? "" : "s"}. Archive it to remove it from the store while keeping order history, or delete anyway to also remove those order lines.`,
          ordersCount: sold,
          canForce: true,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      ...(sold > 0
        ? [
            prisma.downloadGrant.deleteMany({ where: { bookId: id } }),
            prisma.orderItem.deleteMany({ where: { bookId: id } }),
          ]
        : []),
      prisma.book.delete({ where: { id } }),
    ]);

    // Free the stored file + cover (orphaned once the book is gone).
    if (book.fileId) await prisma.bookAsset.deleteMany({ where: { id: book.fileId } });
    if (book.coverImageId)
      await prisma.upload.deleteMany({ where: { id: book.coverImageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Book delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Lightweight status update (archive / restore) without re-validating the whole book. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const status = body?.status;
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const book = await prisma.book.update({ where: { id }, data: { status } });
    return NextResponse.json({ book });
  } catch (error) {
    console.error("Book status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

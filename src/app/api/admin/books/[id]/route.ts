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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;

    // Block deletion if the book has been purchased (preserve order integrity).
    const sold = await prisma.orderItem.count({ where: { bookId: id } });
    if (sold > 0) {
      return NextResponse.json(
        { error: "This book has sales and cannot be deleted. Archive it instead." },
        { status: 409 }
      );
    }

    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Book delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

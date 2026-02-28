import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publicationSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publications = await prisma.publication.findMany({
      orderBy: { year: "desc" },
      include: {
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({ publications });
  } catch (error) {
    console.error("Admin publications fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = publicationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Auto-generate slug from title
    const slug = validation.data.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Ensure slug uniqueness by appending a suffix if needed
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.publication.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const publication = await prisma.publication.create({
      data: {
        ...validation.data,
        slug: finalSlug,
        tags: validation.data.tags || [],
        featured: validation.data.featured || false,
      },
    });

    return NextResponse.json({ publication }, { status: 201 });
  } catch (error) {
    console.error("Publication create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

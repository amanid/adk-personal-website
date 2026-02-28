import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publicationSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const publications = await prisma.publication.findMany({
      orderBy: { year: "desc" },
      select: {
        id: true,
        title: true,
        titleFr: true,
        slug: true,
        abstract: true,
        abstractFr: true,
        authors: true,
        journal: true,
        year: true,
        category: true,
        pdfUrl: true,
        tags: true,
        featured: true,
        views: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ publications });
  } catch (error) {
    console.error("Publications fetch error:", error);
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

    const slug = slugify(validation.data.title);

    const publication = await prisma.publication.create({
      data: {
        ...validation.data,
        slug,
        tags: validation.data.tags || [],
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

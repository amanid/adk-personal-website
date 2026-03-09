import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publicationSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "year";

    const where: Record<string, unknown> = {};
    if (type) where.publicationType = type;

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case "views": orderBy.views = "desc"; break;
      case "downloads": orderBy.downloadCount = "desc"; break;
      case "year_asc": orderBy.year = "asc"; break;
      default: orderBy.year = "desc";
    }

    const publications = await prisma.publication.findMany({
      where,
      orderBy,
    });

    // Merge published research activities as publication entries
    const publishedActivities = await prisma.researchActivity.findMany({
      where: { published: true },
      orderBy: { date: "desc" },
    });

    const activityPubs = publishedActivities.map((a) => ({
      id: a.id,
      title: a.title,
      titleFr: a.titleFr || "",
      slug: `research-activity-${a.id}`,
      abstract: a.description || a.title,
      abstractFr: a.descriptionFr || a.titleFr || "",
      authors: [] as string[],
      journal: a.location || "",
      year: a.date.getFullYear(),
      category: "",
      pdfUrl: a.paperUrl,
      dataUrl: a.dataUrl,
      supplementaryUrl: a.supplementaryUrl,
      tags: [] as string[],
      featured: false,
      views: 0,
      downloadCount: 0,
      publicationType: a.type === "JOURNAL_ARTICLE" ? "JOURNAL_ARTICLE"
        : a.type === "CONFERENCE_PAPER" ? "CONFERENCE_PAPER"
        : a.type === "WORKING_PAPER" ? "WORKING_PAPER"
        : a.type === "TECHNICAL_REPORT" ? "TECHNICAL_REPORT"
        : a.type === "BOOK_CHAPTER" ? "BOOK_CHAPTER"
        : "ANALYTICAL_REPORT",
      accessLevel: a.accessLevel,
      url: a.url,
      _source: "research_activity" as const,
    }));

    return NextResponse.json({ publications: [...publications, ...activityPubs] });
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

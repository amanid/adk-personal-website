import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check if this is a published research activity
    const raPrefix = "research-activity-";
    if (slug.startsWith(raPrefix)) {
      const activityId = slug.slice(raPrefix.length);
      const activity = await prisma.researchActivity.findUnique({
        where: { id: activityId },
      });

      if (!activity || !activity.published) {
        return NextResponse.json(
          { error: "Publication not found" },
          { status: 404 }
        );
      }

      // Map research activity to publication shape
      const publication = {
        id: activity.id,
        title: activity.title,
        titleFr: activity.titleFr,
        slug,
        abstract: activity.description || activity.title,
        abstractFr: activity.descriptionFr || activity.titleFr,
        authors: [] as string[],
        journal: activity.location,
        year: activity.date.getFullYear(),
        month: activity.date.getMonth() + 1,
        category: null,
        pdfUrl: activity.paperUrl,
        dataUrl: activity.dataUrl,
        supplementaryUrl: activity.supplementaryUrl,
        tags: [] as string[],
        featured: false,
        views: 0,
        downloadCount: 0,
        publicationType: activity.type === "JOURNAL_ARTICLE" ? "JOURNAL_ARTICLE"
          : activity.type === "CONFERENCE_PAPER" ? "CONFERENCE_PAPER"
          : activity.type === "WORKING_PAPER" ? "WORKING_PAPER"
          : activity.type === "TECHNICAL_REPORT" ? "TECHNICAL_REPORT"
          : activity.type === "BOOK_CHAPTER" ? "BOOK_CHAPTER"
          : "ANALYTICAL_REPORT",
        accessLevel: activity.accessLevel,
        url: activity.url,
        comments: [],
        _source: "research_activity",
      };

      return NextResponse.json({ publication });
    }

    // Regular publication lookup
    const publication = await prisma.publication.update({
      where: { slug },
      data: { views: { increment: 1 } },
      include: {
        comments: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true, image: true } } },
        },
      },
    });

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ publication });
  } catch (error) {
    console.error("Publication fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // Drafts are not public: look the post up as published first. (An update
    // by slug alone served unpublished posts and counted views on them.)
    const published = await prisma.blogPost.findFirst({ where: { slug, published: true }, select: { id: true } });
    if (!published) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const found = await prisma.blogPost.update({
      where: { id: published.id },
      data: { views: { increment: 1 } },
      include: {
        author: { select: { name: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true } } },
        },
      },
    });

    const post = {
      ...found,
      content: sanitizeRichText(found.content),
      contentFr: found.contentFr ? sanitizeRichText(found.contentFr) : found.contentFr,
    };

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Blog post fetch error:", error);
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    );
  }
}

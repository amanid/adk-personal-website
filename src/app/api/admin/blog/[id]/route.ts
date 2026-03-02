import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { notifySubscribers } from "@/lib/email";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const currentPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { published: true },
    });

    let slug = slugify(body.title);
    const existing = await prisma.blogPost.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: body.title,
        titleFr: body.titleFr || null,
        content: body.content,
        contentFr: body.contentFr || null,
        excerpt: body.excerpt || null,
        excerptFr: body.excerptFr || null,
        coverImage: body.coverImage || null,
        slug,
        category: body.category || null,
        tags: body.tags || [],
        published: body.published || false,
      },
    });

    if (currentPost && !currentPost.published && post.published) {
      notifySubscribers({
        title: post.title,
        excerpt: post.excerpt || post.title,
        url: `/blog/${post.slug}`,
        type: "blog",
      }).catch((err) => console.error("Notification error:", err));
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Blog update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import BlogDetailClient from "./BlogDetailClient";

function clip(text: string, max = 160): string {
  const clean = text
    .replace(/<[^>]*>/g, " ") // strip HTML tags
    .replace(/\s+/g, " ")
    .trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = normalizeLocale(locale);
  const fr = l === "fr";

  let post: {
    title: string;
    titleFr: string | null;
    excerpt: string | null;
    excerptFr: string | null;
    content: string;
    coverImage: string | null;
    published: boolean;
  } | null = null;

  try {
    post = await prisma.blogPost.findUnique({
      where: { slug },
      select: {
        title: true,
        titleFr: true,
        excerpt: true,
        excerptFr: true,
        content: true,
        coverImage: true,
        published: true,
      },
    });
  } catch {
    // DB unavailable — fall through to generic metadata.
  }

  if (!post || !post.published) {
    return {
      title: "Blog",
      description: fr
        ? "Articles sur l'IA, la science des données et la technologie."
        : "Insights on AI, Data Science, and Technology.",
      robots: { index: false },
    };
  }

  const title = (fr && post.titleFr) || post.title;
  const rawDescription = (fr && post.excerptFr) || post.excerpt || post.content;
  const description = clip(rawDescription);

  const meta = buildPageMetadata({
    locale: l,
    path: `/blog/${slug}`,
    title,
    description,
    ogTitle: clip(title, 90),
    ogSubtitle: fr ? "Article de blog" : "Blog",
    ogType: "blog",
  });

  // Prefer a real cover image for social cards when available.
  if (post.coverImage) {
    meta.openGraph = { ...meta.openGraph, images: [post.coverImage] };
    meta.twitter = { ...meta.twitter, images: [post.coverImage] };
  }
  return meta;
}

export const revalidate = 120;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  let initialPost: React.ComponentProps<typeof BlogDetailClient>["initialPost"] = null;
  let initialRelated: React.ComponentProps<typeof BlogDetailClient>["initialRelated"] = [];

  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, published: true },
      select: {
        id: true,
        title: true,
        titleFr: true,
        slug: true,
        content: true,
        contentFr: true,
        excerpt: true,
        category: true,
        tags: true,
        views: true,
        createdAt: true,
        author: { select: { name: true } },
        comments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { name: true } },
          },
        },
      },
    });

    if (post) {
      initialPost = {
        ...post,
        createdAt: post.createdAt.toISOString(),
        comments: post.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
      };
      if (post.category) {
        const related = await prisma.blogPost.findMany({
          where: { published: true, category: post.category, slug: { not: slug } },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { slug: true, title: true, titleFr: true },
        });
        initialRelated = related;
      }
    }
  } catch {
    // DB unavailable — client shows the not-found state.
  }

  return (
    <BlogDetailClient params={params} initialPost={initialPost} initialRelated={initialRelated} />
  );
}

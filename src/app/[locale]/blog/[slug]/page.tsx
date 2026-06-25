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

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  return <BlogDetailClient params={params} />;
}

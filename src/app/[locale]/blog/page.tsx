import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import BlogClient from "./BlogClient";
import PromoStrip from "@/components/promo/PromoStrip";
import { Container } from "@/components/ui/Section";
import { getPromos } from "@/lib/promos";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "blog" });
  const title = t("title");
  const description = t("subtitle");
  return buildPageMetadata({
    locale: l,
    path: "/blog",
    title,
    description,
    ogTitle: title,
    ogSubtitle: description,
    ogType: "blog",
  });
}

export const revalidate = 120;

export default async function BlogPage() {
  let posts: React.ComponentProps<typeof BlogClient>["initialPosts"] = [];
  try {
    const rows = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        titleFr: true,
        slug: true,
        excerpt: true,
        excerptFr: true,
        coverImage: true,
        category: true,
        tags: true,
        views: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    });
    posts = rows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));
  } catch {
    // DB unavailable at build — render an empty list.
  }
  const promos = (await getPromos({ kind: "list" }, { books: 4 })).books;
  return (
    <>
      <BlogClient initialPosts={posts} />
      {promos.length > 0 && (
        <Container className="pb-20 md:pb-28">
          <PromoStrip items={promos} placement="blog-list" />
        </Container>
      )}
    </>
  );
}

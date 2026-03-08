import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      createdAt: true,
      category: true,
      author: { select: { name: true } },
    },
  });

  const baseUrl = "https://www.konanamanidieudonne.org";

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>KONAN Amani Dieudonné - Blog</title>
    <link>${baseUrl}/en/blog</link>
    <description>Insights on AI, Data Science, Statistics, and Technology by KONAN Amani Dieudonné</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/images/profile.jpg</url>
      <title>KONAN Amani Dieudonné</title>
      <link>${baseUrl}</link>
    </image>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/en/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/en/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${post.author?.name || "KONAN Amani Dieudonné"}]]></dc:creator>
      ${post.category ? `<category><![CDATA[${post.category}]]></category>` : ""}
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

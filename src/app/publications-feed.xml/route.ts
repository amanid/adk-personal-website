import { publications } from "@/data/publications";

export async function GET() {
  const baseUrl = "https://www.konanamanidieudonne.org";

  const sorted = [...publications].sort((a, b) => b.year - a.year);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>KONAN Amani Dieudonné - Publications</title>
    <link>${baseUrl}/en/publications</link>
    <description>Academic research, analytical reports, and scholarly publications by KONAN Amani Dieudonné</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/publications-feed.xml" rel="self" type="application/rss+xml"/>
    ${sorted
      .map(
        (pub) => `
    <item>
      <title><![CDATA[${pub.title}]]></title>
      <link>${baseUrl}/en/publications/${pub.slug}</link>
      <guid isPermaLink="true">${baseUrl}/en/publications/${pub.slug}</guid>
      <description><![CDATA[${pub.abstract}]]></description>
      <pubDate>${new Date(pub.year, 0, 1).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${pub.authors.join(", ")}]]></dc:creator>
      ${pub.category ? `<category><![CDATA[${pub.category}]]></category>` : ""}
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

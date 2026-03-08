import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/feed.xml", "/publications-feed.xml"],
        disallow: ["/api/", "/admin/", "/auth/"],
      },
    ],
    sitemap: "https://www.konanamanidieudonne.org/sitemap.xml",
  };
}

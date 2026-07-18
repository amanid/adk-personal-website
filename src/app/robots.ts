import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/feed.xml", "/publications-feed.xml"],
        // Locale-agnostic patterns — actual paths are /en/... and /fr/...
        disallow: [
          "/api/",
          "/*/admin",
          "/*/auth",
          "/*/store/cart",
          "/*/store/receipt",
        ],
      },
    ],
    sitemap: "https://www.konanamanidieudonne.org/sitemap.xml",
  };
}

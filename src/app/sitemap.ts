import { MetadataRoute } from "next";
import { publications } from "@/data/publications";

const BASE_URL = "https://www.konanamanidieudonne.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "fr"];
  const pages = [
    { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/experience", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/services", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/projects", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/publications", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/research", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/qa", changeFrequency: "weekly" as const, priority: 0.5 },
    { path: "/consulting", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/contact", changeFrequency: "yearly" as const, priority: 0.6 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  // Publication detail pages
  for (const locale of locales) {
    for (const pub of publications) {
      entries.push({
        url: `${BASE_URL}/${locale}/publications/${pub.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  }

  return entries;
}

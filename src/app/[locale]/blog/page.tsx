import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import BlogClient from "./BlogClient";

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

export default function BlogPage() {
  return <BlogClient />;
}

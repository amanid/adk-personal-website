import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import PublicationsClient from "./PublicationsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "publications" });
  const title = t("title");
  const description = t("subtitle");
  return buildPageMetadata({
    locale: l,
    path: "/publications",
    title,
    description,
    ogTitle: title,
    ogSubtitle: description,
    ogType: "publication",
  });
}

export default function PublicationsPage() {
  return <PublicationsClient />;
}

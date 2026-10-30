import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import DbaClient from "./DbaClient";

const META = {
  en: {
    title: "DBA: Renting Intelligence",
    description:
      "\"Renting Intelligence\", a DBA thesis in AI submitted in June 2026 to the IIBM Institute of Business Management by KONAN Amani Dieudonné. It uses public data to study how development institutions source AI and whether it changes their performance.",
  },
  fr: {
    title: "DBA : Louer l'Intelligence",
    description:
      "« Louer l'Intelligence », thèse de DBA en IA soumise en juin 2026 à l'IIBM Institute of Business Management par KONAN Amani Dieudonné. Elle s'appuie sur des données publiques pour étudier comment les institutions de développement s'approvisionnent en IA et si cela change leur performance.",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const meta = META[l];
  return buildPageMetadata({
    locale: l,
    path: "/dba",
    title: meta.title,
    description: meta.description,
    ogTitle: "Renting Intelligence",
    ogSubtitle: "DBA thesis · submitted June 2026",
    ogType: "publication",
  });
}

export default function DbaPage() {
  return <DbaClient />;
}

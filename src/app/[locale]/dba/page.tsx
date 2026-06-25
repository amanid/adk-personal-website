import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import DbaClient from "./DbaClient";

const META = {
  en: {
    title: "DBA — Renting Intelligence",
    description:
      "Doctor of Business Administration (AI) at IIBM Institute of Business Management. \"Renting Intelligence\": a quasi-experimental, public-data analysis of AI sourcing choices and institutional performance in international development by KONAN Amani Dieudonné.",
  },
  fr: {
    title: "DBA — Louer l'Intelligence",
    description:
      "Doctorat en Administration des Affaires (IA) à l'IIBM Institute of Business Management. « Louer l'Intelligence » : une analyse quasi-expérimentale sur données publiques des choix d'approvisionnement en IA et de la performance institutionnelle dans le développement international, par KONAN Amani Dieudonné.",
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
    ogSubtitle: "Doctor of Business Administration · AI",
    ogType: "publication",
  });
}

export default function DbaPage() {
  return <DbaClient />;
}

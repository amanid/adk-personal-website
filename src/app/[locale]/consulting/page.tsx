import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import ConsultingClient from "./ConsultingClient";

const META = {
  en: {
    title: "Consulting",
    description:
      "Strategic advisory and consulting in statistics, econometrics, data science, AI/ML engineering, and data architecture for the UN system, development finance, and international organizations.",
  },
  fr: {
    title: "Conseil",
    description:
      "Conseil stratégique et accompagnement en statistique, économétrie, science des données, ingénierie IA/ML et architecture de données pour le système des Nations Unies, la finance du développement et les organisations internationales.",
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
    path: "/consulting",
    title: meta.title,
    description: meta.description,
    ogTitle: meta.title,
    ogSubtitle: l === "fr" ? "Conseil & Advisory" : "Consulting & Advisory",
  });
}

export default function ConsultingPage() {
  return <ConsultingClient />;
}

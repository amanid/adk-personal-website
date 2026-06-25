import type { Metadata } from "next";
import { pageAlternates, normalizeLocale } from "@/lib/seo";
import HomeClient from "./HomeClient";

// The homepage keeps the rich default title/description/OpenGraph from the root
// layout; we only override the canonical + hreflang so it stops inheriting the
// non-localized root canonical.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  return { alternates: pageAlternates(l, "") };
}

export default function HomePage() {
  return <HomeClient />;
}

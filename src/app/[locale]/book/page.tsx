import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import BookingClient, { type PackageOption } from "./BookingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "booking" });
  return buildPageMetadata({
    locale: l,
    path: "/book",
    title: t("meta_title"),
    description: t("meta_description"),
    ogTitle: t("meta_title"),
    ogSubtitle: t("eyebrow"),
  });
}

export default async function BookPage({ searchParams }: { searchParams: Promise<{ package?: string }> }) {
  const { package: preselect } = await searchParams;
  const packages: PackageOption[] = await prisma.servicePackage
    .findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
      select: {
        slug: true,
        title: true,
        titleFr: true,
        description: true,
        descriptionFr: true,
        durationMinutes: true,
        priceCents: true,
        currency: true,
      },
    })
    .catch(() => []);
  return <BookingClient packages={packages} preselect={preselect ?? null} />;
}

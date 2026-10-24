import { cache } from "react";
import { prisma } from "./prisma";
import { experiences as staticExperiences } from "@/data/experience";
import { careerFacts, tenureYears, type CareerFacts } from "./career";
import type { CareerRole } from "./capabilities";

/**
 * The experience records: the database when it has rows, the static seed
 * otherwise — the same rule every page applies, so the figures derived here
 * match what the Experience page lists. Cached per request.
 */
export const getCareerRoles = cache(async (): Promise<CareerRole[]> => {
  try {
    const rows = await prisma.experience.findMany({
      orderBy: { sortOrder: "asc" },
      select: { role: true, roleFr: true, organization: true, location: true, startDate: true, endDate: true },
    });
    if (rows.length) return rows;
  } catch {
    // DB unavailable — fall through to the seed.
  }
  return staticExperiences;
});

export interface AdvisoryPackage {
  slug: string;
  title: string;
  titleFr: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
}

/**
 * The consulting offer every content page leads with: the cheapest paid
 * session (the advisory call) and, when one exists, the free discovery call.
 * Read from the ServicePackage rows the booking page sells, so a price change
 * in admin changes every banner.
 */
export interface AdvisoryOffer {
  paid: AdvisoryPackage | null;
  free: AdvisoryPackage | null;
}

export interface SiteFacts extends CareerFacts {
  /** Whole years at the International Cocoa Organization, quoted in the bio. */
  iccoYears: number | null;
  advisory: AdvisoryOffer;
}

export const getAdvisoryOffer = cache(async (): Promise<AdvisoryOffer> => {
  try {
    const rows = await prisma.servicePackage.findMany({
      where: { active: true },
      orderBy: [{ priceCents: "asc" }, { sortOrder: "asc" }],
      select: { slug: true, title: true, titleFr: true, durationMinutes: true, priceCents: true, currency: true },
      take: 20,
    });
    return {
      paid: rows.find((r) => r.priceCents > 0) ?? null,
      free: rows.find((r) => r.priceCents === 0) ?? null,
    };
  } catch {
    return { paid: null, free: null };
  }
});

/** Facts for layout-level copy (metadata, footer, banners). Never null: the seed always has roles. */
export const getSiteFacts = cache(async (): Promise<SiteFacts> => {
  const [roles, advisory] = await Promise.all([getCareerRoles(), getAdvisoryOffer()]);
  const facts = careerFacts(roles) ?? (careerFacts(staticExperiences) as CareerFacts);
  return { ...facts, iccoYears: tenureYears(roles, /\bICCO\b|International Cocoa Organization/), advisory };
});

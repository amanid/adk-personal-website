import { staticPageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import ExperienceClient, { type ExperienceEntry } from "./ExperienceClient";

export const generateMetadata = staticPageMetadata({ namespace: "experience", path: "/experience" });

export const revalidate = 300;

export default async function ExperiencePage() {
  let experiences: ExperienceEntry[] = [];
  try {
    const rows = await prisma.experience.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        role: true,
        roleFr: true,
        organization: true,
        location: true,
        startDate: true,
        endDate: true,
        description: true,
        descriptionFr: true,
      },
    });
    experiences = rows.map((r) => ({ ...r, roleFr: r.roleFr ?? "" }));
  } catch {
    // DB unavailable — client falls back to static seed.
  }
  return <ExperienceClient initialExperiences={experiences} />;
}

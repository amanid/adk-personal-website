import { staticPageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import AboutClient, {
  type SkillCategoryEntry,
  type EducationEntry,
  type CertificationEntry,
} from "./AboutClient";

export const generateMetadata = staticPageMetadata({ namespace: "about", path: "/about" });

export const revalidate = 300;

export default async function AboutPage() {
  let skillCategories: SkillCategoryEntry[] = [];
  let education: EducationEntry[] = [];
  let certifications: CertificationEntry[] = [];
  let profilePhoto = "";

  try {
    const [cats, edu, certs, settings] = await Promise.all([
      prisma.skillCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { skills: true } }),
      prisma.education.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.certification.findMany({ orderBy: { sortOrder: "asc" } }),
      getSiteSettings(),
    ]);

    skillCategories = cats.map((c) => ({
      id: c.id,
      name: c.name,
      nameFr: c.nameFr ?? "",
      skills: c.skills.map((s) => ({ id: s.id, name: s.name, level: s.level })),
    }));
    education = edu.map((e) => ({
      id: e.id,
      degree: e.degree,
      degreeFr: e.degreeFr,
      institution: e.institution,
      year: e.year,
      location: e.location,
    }));
    certifications = certs.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      year: c.year,
    }));
    if (typeof settings.profilePhoto === "string" && settings.profilePhoto) {
      const url = settings.profilePhoto;
      profilePhoto = url.includes("?") ? url : `${url}?v2`;
    }
  } catch {
    // DB unavailable — client falls back to static seeds.
  }

  return (
    <AboutClient
      initialSkillCategories={skillCategories}
      initialEducation={education}
      initialCertifications={certifications}
      initialProfilePhoto={profilePhoto}
    />
  );
}

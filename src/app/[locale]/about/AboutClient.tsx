"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import {
  skillCategories as staticSkillCategories,
  education as staticEducation,
  certifications as staticCertifications,
  languages,
} from "@/data/skills";
import { Container, Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";

interface SkillEntry {
  id?: string;
  name: string;
}

export interface SkillCategoryEntry {
  id?: string;
  name: string;
  nameFr: string;
  skills: SkillEntry[];
}

export interface EducationEntry {
  id?: string;
  degree: string;
  degreeFr: string | null;
  institution: string;
  year: string;
  location: string;
}

export interface CertificationEntry {
  id?: string;
  name: string;
  issuer: string;
  year: string;
}

interface AboutClientProps {
  initialSkillCategories?: SkillCategoryEntry[];
  initialEducation?: EducationEntry[];
  initialCertifications?: CertificationEntry[];
  initialProfilePhoto?: string;
}

// Formal degrees; certificates and programmes are listed under Certifications.
// \b keeps "MicroMasters" (a certificate programme) out of the degrees.
const DEGREE = /\b(Master|Ingénieur|Bachelor|Licence)/;

export default function AboutClient({
  initialSkillCategories,
  initialEducation,
  initialCertifications,
  initialProfilePhoto,
}: AboutClientProps) {
  const t = useTranslations("about");
  const tHero = useTranslations("hero");
  const tNav = useTranslations("nav");
  const tCreds = useTranslations("certifications_showcase");
  const locale = useLocale();
  const fr = locale === "fr";
  const skillCategories: SkillCategoryEntry[] = initialSkillCategories?.length
    ? initialSkillCategories
    : staticSkillCategories;
  const education: EducationEntry[] = initialEducation?.length ? initialEducation : staticEducation;
  const certifications: CertificationEntry[] = initialCertifications?.length
    ? initialCertifications
    : staticCertifications;
  const degrees = education.filter((e) => DEGREE.test(e.degree));
  const profilePhoto = initialProfilePhoto || "/images/profile.jpg?v2";
  const [surname, ...given] = tHero("name").split(" ");
  const bio = t("bio")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {/* Editorial header: portrait, name, plain biography */}
      <header className="pt-10 pb-16 md:pt-16 md:pb-24">
        <Container>
          <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-start">
            <div className="md:col-span-8 order-2 md:order-1">
              <p className="eyebrow mb-5">{t("title")}</p>
              <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-6">
                {surname}{" "}
                <em className="font-normal text-text-secondary">{given.join(" ")}</em>
              </h1>
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-text-muted mb-8">
                {t("subtitle")}
              </p>
              <h2 className="sr-only">{t("bio_title")}</h2>
              <div className="space-y-5 max-w-2xl">
                {bio.map((p, i) => (
                  <p key={i} className="lede">
                    {p}
                  </p>
                ))}
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <ButtonLink href="/experience" size="lg">
                  {tNav("experience")}
                  <ArrowRight className="w-4 h-4" />
                </ButtonLink>
                <ButtonLink href="/contact" variant="secondary" size="lg">
                  {tHero("cta_contact")}
                </ButtonLink>
              </div>
            </div>

            <figure className="md:col-span-4 order-1 md:order-2 max-w-[16rem] md:max-w-none">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] border border-glass-border bg-surface-1 shadow-[var(--elev-lg)]">
                <Image
                  src={profilePhoto}
                  alt="KONAN Amani Dieudonné"
                  fill
                  className="object-cover scale-[1.04] origin-top-left"
                  sizes="(max-width: 768px) 256px, 360px"
                  priority
                  unoptimized
                />
              </div>
            </figure>
          </div>
        </Container>
      </header>

      {/* Skills: grouped lists, no self-rated levels */}
      <Section title={t("skills_title")}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {skillCategories.map((category) => (
            <div key={category.id ?? category.name}>
              <h3 className="eyebrow text-text-muted mb-4">
                {fr && category.nameFr ? category.nameFr : category.name}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill.id ?? skill.name}
                    className="text-sm px-2.5 py-1 rounded-[var(--radius-sm)] bg-surface-2 text-text-secondary"
                  >
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Education and certifications */}
      <Section title={tCreds("title")}>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
          <div>
            <h3 className="eyebrow text-text-muted mb-2">{t("education_title")}</h3>
            <ul>
              {degrees.map((edu) => (
                <li
                  key={edu.id ?? edu.degree + edu.year}
                  className="grid grid-cols-[4rem_1fr] gap-4 py-4 border-b border-glass-border"
                >
                  <span className="font-mono text-sm text-text-muted tabular-nums pt-0.5">{edu.year}</span>
                  <span>
                    <span className="block text-text-primary leading-snug">
                      {fr && edu.degreeFr ? edu.degreeFr : edu.degree}
                    </span>
                    <span className="block text-sm text-text-muted mt-1">
                      {edu.institution}
                      {edu.location && ` · ${edu.location}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow text-text-muted mb-2">{t("certifications_title")}</h3>
            <ul>
              {certifications.map((cert) => (
                <li
                  key={cert.id ?? cert.name}
                  className="grid grid-cols-[4rem_1fr] gap-4 py-4 border-b border-glass-border"
                >
                  <span className="font-mono text-sm text-text-muted tabular-nums pt-0.5">{cert.year}</span>
                  <span>
                    <span className="block text-text-primary leading-snug">{cert.name}</span>
                    <span className="block text-sm text-text-muted mt-1">{cert.issuer}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Languages */}
      <Section title={t("languages_title")}>
        <dl className="grid sm:grid-cols-3 gap-x-10">
          {languages.map((lang) => (
            <div key={lang.name} className="py-4 border-b border-glass-border">
              <dt className="font-display text-xl">{fr ? lang.nameFr : lang.name}</dt>
              <dd className="text-sm text-text-muted mt-1">{fr ? lang.levelFr : lang.level}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { GraduationCap, Award, Globe, BookOpen } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  skillCategories as staticSkillCategories,
  education as staticEducation,
  certifications as staticCertifications,
  languages,
} from "@/data/skills";

interface SkillEntry {
  id?: string;
  name: string;
  level: number;
}

interface SkillCategoryEntry {
  id?: string;
  name: string;
  nameFr: string;
  skills: SkillEntry[];
}

interface EducationEntry {
  id?: string;
  degree: string;
  degreeFr: string | null;
  institution: string;
  year: string;
  location: string;
}

interface CertificationEntry {
  id?: string;
  name: string;
  issuer: string;
  year: string;
}

export default function AboutPage() {
  const t = useTranslations("about");
  const locale = useLocale();
  const [skillCategories, setSkillCategories] = useState<SkillCategoryEntry[]>(staticSkillCategories);
  const [education, setEducation] = useState<EducationEntry[]>(staticEducation);
  const [certifications, setCertifications] = useState<CertificationEntry[]>(staticCertifications);
  const [profilePhoto, setProfilePhoto] = useState("/images/profile.jpg");

  useEffect(() => {
    Promise.all([
      fetch("/api/skills").then((r) => r.json()).catch(() => null),
      fetch("/api/education").then((r) => r.json()).catch(() => null),
      fetch("/api/certifications").then((r) => r.json()).catch(() => null),
      fetch("/api/settings").then((r) => r.json()).catch(() => null),
    ]).then(([skillsData, eduData, certData, settingsData]) => {
      if (skillsData?.categories?.length > 0) setSkillCategories(skillsData.categories);
      if (eduData?.education?.length > 0) setEducation(eduData.education);
      if (certData?.certifications?.length > 0) setCertifications(certData.certifications);
      if (settingsData?.settings?.profilePhoto) setProfilePhoto(settingsData.settings.profilePhoto);
    });
  }, []);

  return (
    <div className="section-padding">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-text-secondary text-lg">{t("subtitle")}</p>
        </motion.div>

        {/* Bio with Photo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 mb-12"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="shrink-0 mx-auto md:mx-0">
              <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-gold/30">
                <Image
                  src={profilePhoto}
                  alt="Amani Konan Dieudonné"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gold mb-4">
                {t("bio_title")}
              </h2>
              <p className="text-text-secondary leading-relaxed text-base">
                {t("bio")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gold mb-8 text-center">
            {t("skills_title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skillCategories.map((category, catIndex) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.1 }}
                className="glass rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {locale === "fr" ? category.nameFr : category.name}
                </h3>
                <div className="space-y-3">
                  {category.skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">{skill.name}</span>
                        <span className="text-gold">{skill.level}%</span>
                      </div>
                      <div className="h-2 bg-navy-light rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Education & Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Education */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                {t("education_title")}
              </h2>
            </div>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.degree + edu.year} className="border-l-2 border-gold/30 pl-4">
                  <h3 className="font-semibold text-sm">
                    {locale === "fr" ? edu.degreeFr : edu.degree}
                  </h3>
                  <p className="text-text-secondary text-sm">{edu.institution}</p>
                  <p className="text-text-muted text-xs mt-1">
                    {edu.year} · {edu.location}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
                {t("certifications_title")}
              </h2>
            </div>
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div
                  key={cert.name}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Award className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium">{cert.name}</h3>
                    <p className="text-text-muted text-xs">
                      {cert.issuer} · {cert.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">
              {t("languages_title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="flex items-center gap-3 p-3 rounded-lg bg-navy/50"
              >
                <BookOpen className="w-4 h-4 text-gold" />
                <div>
                  <h3 className="text-sm font-medium">
                    {locale === "fr" ? lang.nameFr : lang.name}
                  </h3>
                  <p className="text-text-muted text-xs">
                    {locale === "fr" ? lang.levelFr : lang.level}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

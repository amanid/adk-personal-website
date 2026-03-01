"use client";

import { motion } from "framer-motion";
import { Award, GraduationCap } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { education, certifications } from "@/data/skills";

export default function CertificationsShowcase() {
  const t = useTranslations("certifications_showcase");
  const locale = useLocale();

  // Combine key credentials: select notable education entries and certifications
  const keyEducation = education.filter((e) =>
    ["MIT", "ENSEA", "Toulouse", "Johns Hopkins", "Nexford"].some((k) =>
      e.institution.includes(k)
    )
  );

  return (
    <section className="section-padding bg-navy/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-gold" />
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text">
              {t("title")}
            </h2>
          </div>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Education */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <GraduationCap className="w-5 h-5 text-gold" />
            <h3 className="text-xl font-semibold">{t("education_title")}</h3>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyEducation.map((edu, index) => (
              <motion.div
                key={`${edu.institution}-${edu.year}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass rounded-xl p-5 hover:border-gold/30 transition-all duration-300"
              >
                <p className="text-sm font-semibold text-gold mb-1">
                  {edu.institution}
                </p>
                <p className="text-sm text-text-primary mb-1">
                  {locale === "fr" ? edu.degreeFr : edu.degree}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span>{edu.year}</span>
                  <span>-</span>
                  <span>{edu.location}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <Award className="w-5 h-5 text-gold" />
            <h3 className="text-xl font-semibold">{t("certifications_title")}</h3>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert, index) => (
              <motion.div
                key={`${cert.issuer}-${cert.year}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass rounded-xl p-5 hover:border-gold/30 transition-all duration-300"
              >
                <p className="text-sm font-semibold text-gold mb-1">
                  {cert.issuer}
                </p>
                <p className="text-sm text-text-primary mb-1">{cert.name}</p>
                <p className="text-xs text-text-muted">{cert.year}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

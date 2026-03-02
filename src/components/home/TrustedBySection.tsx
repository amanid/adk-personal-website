"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Globe, ChevronDown, ExternalLink } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { organizations } from "@/data/organizations";

export default function TrustedBySection() {
  const t = useTranslations("organizations");
  const locale = useLocale();
  const [showAdvisoryDetails, setShowAdvisoryDetails] = useState(false);

  const coreOrgs = organizations.filter((o) => o.tier === "core");
  const advisoryOrgs = organizations.filter((o) => o.tier === "advisory");

  const unAbbreviations = advisoryOrgs.map((o) => o.abbreviation).join(", ");

  return (
    <section className="section-padding bg-navy/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Core Institutions */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <Building2 className="w-5 h-5 text-gold" />
            <h3 className="text-xl font-semibold">{t("core_title")}</h3>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreOrgs.map((org, index) => (
              <motion.a
                key={org.id}
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300 group block"
              >
                <p className="text-2xl font-bold gradient-text font-[family-name:var(--font-display)] mb-2 group-hover:scale-105 transition-transform origin-left">
                  {org.abbreviation}
                </p>
                <p className="text-sm text-text-secondary mb-2">
                  {locale === "fr" ? org.nameFr : org.name}
                </p>
                <p className="text-xs text-text-muted">{org.location}</p>
              </motion.a>
            ))}
          </div>
        </div>

        {/* United Nations & International Research — Strong paragraph + View More */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <Globe className="w-5 h-5 text-gold" />
            <h3 className="text-xl font-semibold">{t("advisory_title")}</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-xl p-6 md:p-8"
          >
            <p className="text-text-secondary leading-relaxed text-base md:text-lg">
              {locale === "fr"
                ? `Engagements de conseil et de recherche avec des agences de premier plan du système des Nations Unies et des instituts internationaux de recherche, notamment ${unAbbreviations}. Ces missions ont porté sur l'analyse de données, la modélisation statistique, la recherche en politiques et le développement de solutions technologiques pour des défis mondiaux — de la sécurité des télécommunications et les flux migratoires à la recherche sur le désarmement et les systèmes alimentaires durables.`
                : `Advisory and research engagements with leading United Nations agencies and international research institutes, including ${unAbbreviations}. These missions spanned data analysis, statistical modeling, policy research, and technology solution development for global challenges — from telecommunications security and migration flows to disarmament research and sustainable food systems.`}
            </p>

            <button
              onClick={() => setShowAdvisoryDetails(!showAdvisoryDetails)}
              className="flex items-center gap-2 mt-5 text-gold text-sm font-medium hover:text-gold-light transition-colors"
            >
              {showAdvisoryDetails
                ? (locale === "fr" ? "Réduire" : "Show less")
                : (locale === "fr" ? "Voir les organisations" : "View organizations")}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  showAdvisoryDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showAdvisoryDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-glass-border">
                    {advisoryOrgs.map((org, index) => (
                      <motion.a
                        key={org.id}
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="flex items-start gap-3 p-4 rounded-lg bg-navy/50 hover:bg-navy/80 transition-all group"
                      >
                        <div className="flex-1">
                          <p className="text-lg font-bold gradient-text font-[family-name:var(--font-display)] mb-1 group-hover:scale-105 transition-transform origin-left">
                            {org.abbreviation}
                          </p>
                          <p className="text-sm text-text-secondary mb-1">
                            {locale === "fr" ? org.nameFr : org.name}
                          </p>
                          <p className="text-xs text-text-muted">{org.location}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-gold transition-colors mt-1 shrink-0" />
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

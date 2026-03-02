"use client";

import { motion } from "framer-motion";
import { Building2, Globe } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { organizations } from "@/data/organizations";

export default function TrustedBySection() {
  const t = useTranslations("organizations");
  const locale = useLocale();

  const coreOrgs = organizations.filter((o) => o.tier === "core");
  const advisoryOrgs = organizations.filter((o) => o.tier === "advisory");

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

        {/* United Nations & International Research */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advisoryOrgs.map((org, index) => (
              <motion.a
                key={org.id}
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-5 hover:border-gold/30 transition-all duration-300 group block"
              >
                <p className="text-xl font-bold gradient-text font-[family-name:var(--font-display)] mb-1.5 group-hover:scale-105 transition-transform origin-left">
                  {org.abbreviation}
                </p>
                <p className="text-sm text-text-secondary mb-1.5">
                  {locale === "fr" ? org.nameFr : org.name}
                </p>
                <p className="text-xs text-text-muted">{org.location}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

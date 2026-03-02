"use client";

import { motion } from "framer-motion";
import { MapPin, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

const continents = [
  {
    key: "europe",
    countries: ["France", "Switzerland", "United Kingdom"],
  },
  {
    key: "africa",
    countries: ["Côte d'Ivoire", "Egypt", "Kenya", "Cameroon", "Senegal", "Nigeria"],
  },
  {
    key: "middle_east",
    countries: ["United Arab Emirates"],
  },
  {
    key: "global",
    countries: ["USA", "India", "Canada"],
  },
];

export default function GlobalReachSection() {
  const t = useTranslations("globalReach");

  return (
    <section className="section-padding">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Globe className="w-6 h-6 text-gold" />
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text">
              {t("title")}
            </h2>
          </div>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {continents.map((continent, index) => (
            <motion.div
              key={continent.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="gradient-text">{t(`continent_${continent.key}`)}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {continent.countries.map((country) => (
                  <span
                    key={country}
                    className="flex items-center gap-1.5 text-sm text-text-secondary"
                  >
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    {country}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

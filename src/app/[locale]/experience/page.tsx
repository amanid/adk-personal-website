"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { experiences as staticExperiences } from "@/data/experience";

interface ExperienceEntry {
  id: string;
  role: string;
  roleFr: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string[];
  descriptionFr: string[];
}

export default function ExperiencePage() {
  const t = useTranslations("experience");
  const locale = useLocale();
  const [experiences, setExperiences] = useState<ExperienceEntry[]>(staticExperiences);
  const [expandedId, setExpandedId] = useState<string | null>(staticExperiences[0].id);

  useEffect(() => {
    fetch("/api/experience")
      .then((res) => res.json())
      .then((data) => {
        if (data.experiences?.length > 0) {
          setExperiences(data.experiences);
          setExpandedId(data.experiences[0].id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
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

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold via-gold/50 to-transparent" />

          <div className="space-y-6">
            {experiences.map((exp, index) => {
              const isExpanded = expandedId === exp.id;
              const descriptions =
                locale === "fr" ? exp.descriptionFr : exp.description;
              const role = locale === "fr" ? exp.roleFr : exp.role;

              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-12 md:pl-20"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 md:left-6.5 top-6 w-3 h-3 rounded-full bg-gold border-2 border-charcoal z-10" />

                  <div
                    className={`glass rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                      isExpanded ? "border-gold/30" : "hover:border-gold/20"
                    }`}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : exp.id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {role}
                        </h3>
                        <p className="text-gold font-medium text-sm mt-1">
                          {exp.organization}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-text-muted text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {exp.startDate} – {exp.endDate || t("present")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {exp.location}
                          </span>
                        </div>
                      </div>
                      <button className="text-text-muted hover:text-gold transition-colors p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Expandable details */}
                    <motion.div
                      initial={false}
                      animate={{
                        height: isExpanded ? "auto" : 0,
                        opacity: isExpanded ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-4 space-y-2 border-t border-glass-border pt-4">
                        {descriptions.map((desc, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-text-secondary text-sm"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                            {desc}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { FlaskConical, BookOpen } from "lucide-react";
import { Link } from "@/i18n/routing";
import ResearchTimeline from "@/components/publications/ResearchTimeline";

export default function ResearchPage() {
  const t = useTranslations("research");
  const locale = useLocale();

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          <Link
            href="/publications"
            className="flex items-center gap-2 glass rounded-lg px-5 py-3 text-sm text-text-secondary hover:text-gold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            {t("view_publications")}
          </Link>
        </motion.div>

        {/* Research Activities Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <FlaskConical className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-semibold font-[family-name:var(--font-display)]">
              {t("timeline_title")}
            </h2>
          </div>
          <ResearchTimeline locale={locale} />
        </motion.div>
      </div>
    </div>
  );
}

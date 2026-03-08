"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <div className="section-padding min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
          404
        </div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-3">
          {t("not_found_title")}
        </h2>
        <p className="text-text-secondary text-sm mb-8">
          {t("not_found_desc")}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            {t("go_home")}
          </Link>
          <Link
            href="/publications"
            className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-lg text-text-secondary hover:text-gold transition-colors text-sm"
          >
            <Search className="w-4 h-4" />
            {t("publications")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

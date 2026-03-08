"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="section-padding min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-3">
          {t("error_title")}
        </h2>
        <p className="text-text-secondary text-sm mb-8">
          {t("error_desc")}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t("try_again")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-lg text-text-secondary hover:text-gold transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            {t("go_home")}
          </Link>
        </div>
        {error.digest && (
          <p className="text-text-muted text-xs mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}

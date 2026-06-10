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
  const RELOAD_KEY = "__stale_deploy_reloaded";

  // Detect errors caused by a stale client bundle after a new deployment
  // (old cached JS calling a build it no longer matches). These resolve by
  // loading the fresh bundle, so recover automatically with a single reload.
  const isStaleDeploymentError = (() => {
    const msg = `${error?.name ?? ""} ${error?.message ?? ""}`;
    return (
      error?.name === "ChunkLoadError" ||
      /Failed to find Server Action/i.test(msg) ||
      /Loading( CSS)? chunk .* failed/i.test(msg) ||
      /dynamically imported module/i.test(msg) ||
      /from an older or newer deployment/i.test(msg)
    );
  })();

  // Only recover once per session — if the error persists after the reload,
  // fall through to the normal error UI instead of looping or blanking.
  const willRecover =
    isStaleDeploymentError &&
    typeof window !== "undefined" &&
    !sessionStorage.getItem(RELOAD_KEY);

  useEffect(() => {
    console.error("Application error:", error);
    if (willRecover) {
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    }
  }, [error, willRecover]);

  // While the one-time recovery reload is in flight, don't flash the error UI.
  if (willRecover) {
    return null;
  }

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

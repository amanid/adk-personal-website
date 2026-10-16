"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

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
    <Container size="prose" className="py-20 md:py-28 min-h-[60vh]">
      <p className="eyebrow mb-5">{t("error")}</p>
      <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">
        {t("error_title")}
      </h1>
      <p className="lede max-w-xl mb-10">{t("error_desc")}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} size="lg">
          <RefreshCw className="w-4 h-4" />
          {t("try_again")}
        </Button>
        <ButtonLink href="/" variant="secondary" size="lg">
          {t("go_home")}
        </ButtonLink>
      </div>
      {error.digest && (
        <p className="font-mono text-xs text-text-muted mt-10">Error ID: {error.digest}</p>
      )}
    </Container>
  );
}

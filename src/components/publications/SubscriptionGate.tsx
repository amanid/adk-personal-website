"use client";

import { Link } from "@/i18n/routing";
import { Lock, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useSubscription } from "@/hooks/useSubscription";
import { buttonClass } from "@/components/ui/Button";

interface SubscriptionGateProps {
  accessLevel: "FREE" | "GATED";
  requiredAccess: "document" | "data";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function SubscriptionGate({
  accessLevel,
  requiredAccess,
  children,
  fallback,
}: SubscriptionGateProps) {
  const { data: session } = useSession();
  const { hasDocumentAccess, hasDataAccess, isLoading } = useSubscription();
  const locale = useLocale();

  if (accessLevel === "FREE") return <>{children}</>;

  if (isLoading) {
    return (
      <div aria-hidden className="animate-pulse card p-6">
        <div className="h-4 bg-[var(--hover-wash)] rounded w-48" />
      </div>
    );
  }

  const hasAccess =
    requiredAccess === "document" ? hasDocumentAccess : hasDataAccess;

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="card p-6">
      <h3 className="font-display text-xl mb-2 flex items-center gap-2">
        <Lock aria-hidden className="w-4 h-4 text-gold" />
        {locale === "fr"
          ? "Réservé aux abonnés"
          : "Members only"}
      </h3>
      <p className="text-text-secondary mb-5 max-w-md">
        {requiredAccess === "document"
          ? locale === "fr"
            ? "Abonnez-vous pour accéder au document complet de cette publication."
            : "Subscribe to access the full document for this publication."
          : locale === "fr"
            ? "Abonnez-vous pour accéder aux données sous-jacentes de cette publication."
            : "Subscribe to access the underlying data for this publication."}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/subscribe"
          className={buttonClass("primary", "md")}
        >
          {locale === "fr" ? "Voir les forfaits" : "View Plans"}
          <ArrowRight aria-hidden className="w-4 h-4" />
        </Link>
        {!session && (
          <Link
            href="/auth/login"
            className={buttonClass("ghost", "md")}
          >
            {locale === "fr" ? "Se connecter" : "Sign In"}
          </Link>
        )}
      </div>
    </div>
  );
}

"use client";

import { Link } from "@/i18n/routing";
import { Lock, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useSubscription } from "@/hooks/useSubscription";

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
      <div className="animate-pulse glass rounded-lg p-6 text-center">
        <div className="w-8 h-8 mx-auto bg-gold/20 rounded-full mb-2" />
        <div className="h-4 bg-gold/10 rounded w-48 mx-auto" />
      </div>
    );
  }

  const hasAccess =
    requiredAccess === "document" ? hasDocumentAccess : hasDataAccess;

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="glass rounded-xl p-6 text-center border border-gold/20">
      <Lock className="w-8 h-8 text-gold mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-2">
        {locale === "fr"
          ? "Abonnement Requis"
          : "Subscription Required"}
      </h3>
      <p className="text-text-secondary text-sm mb-4 max-w-md mx-auto">
        {requiredAccess === "document"
          ? locale === "fr"
            ? "Abonnez-vous pour accéder au document complet de cette publication."
            : "Subscribe to access the full document for this publication."
          : locale === "fr"
            ? "Abonnez-vous pour accéder aux données sous-jacentes de cette publication."
            : "Subscribe to access the underlying data for this publication."}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 px-5 py-2 bg-gold text-charcoal font-medium text-sm rounded-lg hover:bg-gold-light transition-colors"
        >
          {locale === "fr" ? "Voir les forfaits" : "View Plans"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {!session && (
          <Link
            href="/auth/login"
            className="text-sm text-text-muted hover:text-gold transition-colors"
          >
            {locale === "fr" ? "Se connecter" : "Sign In"}
          </Link>
        )}
      </div>
    </div>
  );
}

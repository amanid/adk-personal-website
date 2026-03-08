"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Check,
  FileText,
  Database,
  Crown,
  Sparkles,
  ArrowRight,
  Settings,
} from "lucide-react";

const tiers = [
  {
    id: "DOCUMENT_ACCESS" as const,
    icon: FileText,
    color: "text-cyan-400",
    borderColor: "border-cyan-400/30",
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    features: {
      en: [
        "Full PDF access for all premium publications",
        "New reports as they are published",
        "Academic citation exports",
        "Reading list & bookmarks",
      ],
      fr: [
        "Accès PDF complet pour toutes les publications premium",
        "Nouveaux rapports dès leur publication",
        "Export de citations académiques",
        "Liste de lecture et favoris",
      ],
    },
    excluded: {
      en: ["Underlying datasets", "Raw data downloads"],
      fr: ["Jeux de données sous-jacents", "Téléchargements de données brutes"],
    },
    popular: false,
  },
  {
    id: "DATA_ACCESS" as const,
    icon: Database,
    color: "text-emerald-400",
    borderColor: "border-emerald-400/30",
    monthlyPrice: 14.99,
    yearlyPrice: 149,
    features: {
      en: [
        "Underlying datasets for all premium publications",
        "CSV/Excel data exports",
        "Methodology documentation",
        "API access to data (coming soon)",
      ],
      fr: [
        "Jeux de données pour toutes les publications premium",
        "Export de données CSV/Excel",
        "Documentation méthodologique",
        "Accès API aux données (bientôt)",
      ],
    },
    excluded: {
      en: ["Full PDF reports"],
      fr: ["Rapports PDF complets"],
    },
    popular: false,
  },
  {
    id: "FULL_ACCESS" as const,
    icon: Crown,
    color: "text-gold",
    borderColor: "border-gold/30",
    monthlyPrice: 19.99,
    yearlyPrice: 199,
    features: {
      en: [
        "Everything in Document Access",
        "Everything in Data Access",
        "Priority access to new publications",
        "Direct Q&A with the author",
        "Custom data requests (1/month)",
      ],
      fr: [
        "Tout l'accès Document",
        "Tout l'accès Données",
        "Accès prioritaire aux nouvelles publications",
        "Q&R directe avec l'auteur",
        "Demandes de données personnalisées (1/mois)",
      ],
    },
    excluded: { en: [], fr: [] },
    popular: true,
  },
];

export default function SubscribePage() {
  const t = useTranslations("subscribe");
  const locale = useLocale();
  const { data: session } = useSession();
  const subscription = useSubscription();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (!session) {
      window.location.href = `/${locale}/auth/login?callbackUrl=/${locale}/subscribe`;
      return;
    }

    setLoadingTier(tierId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Handle error silently
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManage = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Handle error silently
    }
  };

  const yearlySavings = Math.round(
    ((tiers[2].monthlyPrice * 12 - tiers[2].yearlyPrice) /
      (tiers[2].monthlyPrice * 12)) *
      100
  );

  return (
    <div className="section-padding">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-gold text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            {t("badge")}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Active subscription banner */}
        {subscription.tier && subscription.status === "ACTIVE" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-4 mb-8 flex items-center justify-between"
          >
            <div>
              <span className="text-sm text-gold font-medium">
                {t("current_plan")}: {t(`tier_${subscription.tier?.toLowerCase()}`)}
              </span>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-xs text-text-muted mt-1">
                  {t("cancels_at_period_end")}
                </p>
              )}
            </div>
            <button
              onClick={handleManage}
              className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm hover:text-gold transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t("manage_subscription")}
            </button>
          </motion.div>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-gold text-charcoal"
                : "glass text-text-secondary hover:text-gold"
            }`}
          >
            {t("monthly")}
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === "yearly"
                ? "bg-gold text-charcoal"
                : "glass text-text-secondary hover:text-gold"
            }`}
          >
            {t("yearly")}
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              -{yearlySavings}%
            </span>
          </button>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier, i) => {
            const price =
              billing === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
            const isCurrentTier = subscription.tier === tier.id;
            const features =
              locale === "fr" ? tier.features.fr : tier.features.en;
            const excluded =
              locale === "fr" ? tier.excluded.fr : tier.excluded.en;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative glass rounded-2xl p-6 flex flex-col ${
                  tier.popular ? "ring-2 ring-gold/50" : ""
                } ${isCurrentTier ? "ring-2 ring-green-500/50" : ""}`}
              >
                {tier.popular && !isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-gold text-charcoal text-xs font-bold rounded-full">
                      {t("best_value")}
                    </span>
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      {t("current_plan")}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <tier.icon className={`w-8 h-8 ${tier.color} mb-3`} />
                  <h3 className="text-lg font-bold">
                    {t(`tier_${tier.id.toLowerCase()}`)}
                  </h3>
                  <p className="text-text-secondary text-xs mt-1">
                    {t(`tier_${tier.id.toLowerCase()}_desc`)}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold">${price}</span>
                  <span className="text-text-muted text-sm">
                    {billing === "monthly" ? t("per_month") : t("per_year")}
                  </span>
                  {billing === "yearly" && (
                    <p className="text-xs text-text-muted mt-1">
                      ${(tier.yearlyPrice / 12).toFixed(2)}{t("per_month")}
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-4 flex-1">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${tier.color}`}
                      />
                      {feature}
                    </li>
                  ))}
                  {excluded.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-muted line-through opacity-50"
                    >
                      <span className="w-4 h-4 shrink-0 mt-0.5 text-center">
                        &times;
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                {isCurrentTier ? (
                  <button
                    onClick={handleManage}
                    className="w-full text-center py-2.5 rounded-lg font-medium text-sm glass hover:text-gold transition-colors"
                  >
                    {t("manage_subscription")}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loadingTier !== null}
                    className={`w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                      tier.popular
                        ? "bg-gold text-charcoal hover:bg-gold-light"
                        : "glass hover:text-gold"
                    }`}
                  >
                    {loadingTier === tier.id ? (
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      t("subscribe_now")
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* What's included */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 mb-16"
        >
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-center mb-6">
            {t("whats_included")}
          </h2>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
            {t("whats_included_desc")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              t("included_1"),
              t("included_2"),
              t("included_3"),
              t("included_4"),
              t("included_5"),
              t("included_6"),
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-text-secondary"
              >
                <Check className="w-4 h-4 text-gold shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-center mb-8">
            {t("faq_title")}
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <details key={i} className="glass rounded-xl overflow-hidden group">
                <summary className="p-5 cursor-pointer flex items-center justify-between hover:bg-gold/5 transition-colors">
                  <span className="font-medium text-sm pr-4">
                    {t(`faq_q${i}`)}
                  </span>
                  <span className="text-gold transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {t(`faq_a${i}`)}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center glass rounded-2xl p-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("cta_title")}
          </h2>
          <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
            {t("cta_desc")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/publications"
              className="inline-flex items-center gap-2 px-6 py-3 glass rounded-lg text-text-secondary hover:text-gold transition-colors"
            >
              {t("browse_publications")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

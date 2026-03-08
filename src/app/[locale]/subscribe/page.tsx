"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  Check,
  FileText,
  Database,
  Crown,
  Sparkles,
  ArrowRight,
  Send,
  User,
  Mail,
  Building2,
  MessageSquare,
} from "lucide-react";

const tiers = [
  {
    id: "DOCUMENT_ACCESS" as const,
    icon: FileText,
    color: "text-cyan-400",
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
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const yearlySavings = Math.round(
    ((tiers[2].monthlyPrice * 12 - tiers[2].yearlyPrice) /
      (tiers[2].monthlyPrice * 12)) *
      100
  );

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    setSubmitted(false);
    setError(false);
    // Scroll to form
    setTimeout(() => {
      document.getElementById("subscription-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier || !formData.name || !formData.email) return;

    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tier: selectedTier,
          billing,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", organization: "", message: "" });
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTierData = tiers.find((t) => t.id === selectedTier);

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
            const isSelected = selectedTier === tier.id;
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
                className={`relative glass rounded-2xl p-6 flex flex-col cursor-pointer transition-all duration-300 ${
                  tier.popular && !isSelected ? "ring-2 ring-gold/50" : ""
                } ${isSelected ? "ring-2 ring-gold scale-[1.02]" : "hover:border-gold/30"}`}
                onClick={() => handleSelectTier(tier.id)}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-gold text-charcoal text-xs font-bold rounded-full">
                      {t("best_value")}
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

                <button
                  className={`w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    isSelected
                      ? "bg-gold text-charcoal"
                      : tier.popular
                        ? "bg-gold/80 text-charcoal hover:bg-gold"
                        : "glass hover:text-gold"
                  }`}
                >
                  {isSelected ? t("selected") : t("subscribe_now")}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Subscription Request Form */}
        <AnimatePresence>
          {selectedTier && (
            <motion.div
              id="subscription-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-8 max-w-2xl mx-auto mb-16"
            >
              <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gold mb-2">
                {t("form_title")}
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                {selectedTierData && (
                  <span className="text-gold font-medium">
                    {t(`tier_${selectedTierData.id.toLowerCase()}`)}
                  </span>
                )}
                {" — "}
                {t("form_desc")}
              </p>

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
                >
                  <p className="font-medium">{t("form_success_title")}</p>
                  <p className="text-green-400/80 mt-1">{t("form_success_desc")}</p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {t("form_error")}
                </motion.div>
              )}

              {!submitted && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
                        <User className="w-3.5 h-3.5" />
                        {t("form_name")} *
                      </label>
                      <input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {t("form_email")} *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {t("form_organization")}
                    </label>
                    <input
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm text-text-secondary mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t("form_message")}
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={3}
                      placeholder={locale === "fr" ? "Questions ou besoins spécifiques..." : "Any questions or specific requirements..."}
                      className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-gold/20 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {submitting ? "" : t("form_submit")}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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

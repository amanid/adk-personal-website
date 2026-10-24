"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PayPalSubscribeButton from "@/components/payments/PayPalSubscribeButton";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import { TIER_PRICES } from "@/lib/subscription-plans";
import { Check, Minus, ArrowRight, Send, Plus } from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/*
 * Tier features list only what the code delivers: gated report PDFs for
 * document plans; every dataset/supplementary file plus API Pro for data plans
 * (src/lib/subscription.ts, src/lib/publication-access.ts, src/lib/data-api.ts).
 */
const tiers = [
  {
    id: "DOCUMENT_ACCESS" as const,
    monthlyPrice: TIER_PRICES.DOCUMENT_ACCESS.MONTH / 100,
    yearlyPrice: TIER_PRICES.DOCUMENT_ACCESS.YEAR / 100,
    features: {
      en: ["Full PDF access for all premium publications", "New premium reports as they are published"],
      fr: ["Accès PDF complet pour toutes les publications premium", "Nouveaux rapports premium dès leur publication"],
    },
    excluded: {
      en: ["Datasets and supplementary files"],
      fr: ["Jeux de données et fichiers complémentaires"],
    },
    popular: false,
  },
  {
    id: "DATA_ACCESS" as const,
    monthlyPrice: TIER_PRICES.DATA_ACCESS.MONTH / 100,
    yearlyPrice: TIER_PRICES.DATA_ACCESS.YEAR / 100,
    features: {
      en: [
        "Every dataset and supplementary file behind the publications",
        "Data API Pro included: dataset downloads and higher limits",
      ],
      fr: [
        "Tous les jeux de données et fichiers complémentaires des publications",
        "API Données Pro incluse : téléchargement des jeux de données et limites plus élevées",
      ],
    },
    excluded: {
      en: ["Premium PDF reports"],
      fr: ["Rapports PDF premium"],
    },
    popular: false,
  },
  {
    id: "FULL_ACCESS" as const,
    monthlyPrice: TIER_PRICES.FULL_ACCESS.MONTH / 100,
    yearlyPrice: TIER_PRICES.FULL_ACCESS.YEAR / 100,
    features: {
      en: ["Everything in Document Access", "Everything in Data Access", "Data API Pro included"],
      fr: ["Tout l'accès Document", "Tout l'accès Données", "API Données Pro incluse"],
    },
    excluded: { en: [], fr: [] },
    popular: true,
  },
];

const field =
  "w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
  "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";
const labelCls = "block text-sm text-text-secondary mb-1.5";

export default function SubscribeClient() {
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

  // Automatic billing through PayPal, when plans have been set up in admin.
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const [plans, setPlans] = useState<Record<string, { MONTH: string; YEAR: string }> | null>(null);
  const [current, setCurrent] = useState<{
    tier: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    provider?: string;
  } | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  const loadStatus = useCallback(() => {
    fetch("/api/subscription/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCurrent(d?.tier ? d : null))
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch("/api/subscription/paypal/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? null))
      .catch(() => {});
    loadStatus();
  }, [loadStatus, userId]);

  const cancelRenewal = async () => {
    if (!confirm(t("pp_cancel_confirm"))) return;
    const res = await fetch("/api/subscription/paypal/cancel", { method: "POST" });
    if (res.ok) loadStatus();
    else alert(t("pp_error"));
  };
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(new Date(d));

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
    <>
      <Container className="pt-14 pb-4 md:pt-20">
        <p className="eyebrow mb-4">{t("badge")}</p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5 max-w-4xl">
          {t("title")}
        </h1>
        <p className="lede max-w-2xl">{t("subtitle")}</p>
      </Container>

      <Section className="pt-10 md:pt-14">
        {/* Billing toggle */}
        <div
          role="group"
          aria-label={`${t("monthly")} / ${t("yearly")}`}
          className="inline-flex p-1 mb-10 rounded-[var(--radius-md)] border border-glass-border bg-surface-1"
        >
          {(["monthly", "yearly"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              aria-pressed={billing === b}
              className={cn(
                "min-h-11 px-5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors inline-flex items-center gap-2",
                billing === b ? "bg-gold text-charcoal" : "text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]"
              )}
            >
              {t(b)}
              {b === "yearly" && (
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    billing === b ? "text-charcoal/80" : "text-success"
                  )}
                >
                  −{yearlySavings}%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Current plan */}
        {current?.tier && (
          <div role="status" className="card p-5 max-w-2xl mb-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{t("pp_active", { tier: t(`tier_${current.tier.toLowerCase()}`) })}</p>
              {current.currentPeriodEnd && (
                <p className="text-sm text-text-secondary">
                  {current.cancelAtPeriodEnd
                    ? t("pp_ends", { date: fmtDate(current.currentPeriodEnd) })
                    : t("pp_renews", { date: fmtDate(current.currentPeriodEnd) })}
                </p>
              )}
            </div>
            {current.provider === "PAYPAL" && !current.cancelAtPeriodEnd && (
              <Button type="button" variant="secondary" size="md" onClick={cancelRenewal}>
                {t("pp_cancel")}
              </Button>
            )}
          </div>
        )}

        {/* Pricing cards */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((tier) => {
            const price = billing === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
            const isSelected = selectedTier === tier.id;
            const features = locale === "fr" ? tier.features.fr : tier.features.en;
            const excluded = locale === "fr" ? tier.excluded.fr : tier.excluded.en;
            const name = t(`tier_${tier.id.toLowerCase()}`);

            return (
              <li
                key={tier.id}
                className={cn(
                  "card p-6 flex flex-col",
                  tier.popular && "card-feature",
                  isSelected && "ring-2 ring-gold"
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-2xl leading-tight">{name}</h2>
                  {tier.popular && (
                    <span className="font-mono text-xs uppercase tracking-[0.08em] text-gold shrink-0">
                      {t("best_value")}
                    </span>
                  )}
                </div>
                <p className="text-text-secondary text-sm mt-2">{t(`tier_${tier.id.toLowerCase()}_desc`)}</p>

                <p className="mt-5 mb-6">
                  <span className="font-mono tabular-nums text-3xl text-text-primary">${price}</span>
                  <span className="font-mono text-sm text-text-muted">
                    {billing === "monthly" ? t("per_month") : t("per_year")}
                  </span>
                  {billing === "yearly" && (
                    <span className="block font-mono tabular-nums text-xs text-text-muted mt-1">
                      ${(tier.yearlyPrice / 12).toFixed(2)}
                      {t("per_month")}
                    </span>
                  )}
                </p>

                <ul className="space-y-2.5 mb-6 flex-1 pt-4 hairline">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-gold" aria-hidden />
                      {feature}
                    </li>
                  ))}
                  {excluded.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                      <Minus className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                      <span>
                        <span className="sr-only">{locale === "fr" ? "Non inclus : " : "Not included: "}</span>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSelectTier(tier.id)}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? t("selected") : t("subscribe_now")}: ${name}`}
                  className={buttonClass(isSelected || tier.popular ? "primary" : "secondary", "md", "w-full")}
                >
                  {isSelected && <Check className="w-4 h-4" aria-hidden />}
                  {isSelected ? t("selected") : t("subscribe_now")}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Subscription request form */}
        <AnimatePresence>
          {selectedTier && (
            <motion.div
              id="subscription-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="card p-6 md:p-8 max-w-2xl mx-auto mt-12"
            >
              <h2 className="font-display text-3xl leading-tight mb-2">{t("form_title")}</h2>
              <p className="text-text-secondary text-sm mb-6">
                {selectedTierData && (
                  <span className="text-gold font-medium">{t(`tier_${selectedTierData.id.toLowerCase()}`)}</span>
                )}
                {" · "}
                {t("form_desc")}
              </p>

              {/* Automatic billing with PayPal */}
              {plans && selectedTier && plans[selectedTier] && (
                <div className="mb-8 pb-8 border-b border-glass-border">
                  <h3 className="font-semibold mb-1">{t("pp_title")}</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    {t("pp_desc", { period: billing === "monthly" ? t("pp_month") : t("pp_year") })}
                  </p>
                  {subscribed ? (
                    <p
                      role="status"
                      className="p-4 rounded-[var(--radius-md)] bg-success/10 border border-success/30 text-success text-sm"
                    >
                      {t("pp_success")}
                    </p>
                  ) : userId ? (
                    <PayPalSubscribeButton
                      planId={plans[selectedTier][billing === "monthly" ? "MONTH" : "YEAR"]}
                      userId={userId}
                      onActivated={() => {
                        setSubscribed(true);
                        loadStatus();
                      }}
                      labels={{ loading: t("pp_loading"), error: t("pp_error"), verifying: t("pp_verifying") }}
                    />
                  ) : (
                    <ButtonLink href={`/auth/login?callbackUrl=${encodeURIComponent(`/${locale}/subscribe`)}`}>
                      {t("pp_signin")}
                    </ButtonLink>
                  )}
                  <p className="text-sm text-text-muted mt-4">{t("pp_or_manual")}</p>
                </div>
              )}

              {submitted && (
                <div
                  role="status"
                  className="mb-5 p-4 rounded-[var(--radius-md)] bg-success/10 border border-success/30 text-success text-sm"
                >
                  <p className="font-medium">{t("form_success_title")}</p>
                  <p className="mt-1">{t("form_success_desc")}</p>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="mb-5 p-3 rounded-[var(--radius-md)] bg-danger/10 border border-danger/30 text-danger text-sm"
                >
                  {t("form_error")}
                </p>
              )}

              {!submitted && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="sub-name" className={labelCls}>
                        {t("form_name")} <span aria-hidden>*</span>
                      </label>
                      <input
                        id="sub-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoComplete="name"
                        className={field}
                      />
                    </div>
                    <div>
                      <label htmlFor="sub-email" className={labelCls}>
                        {t("form_email")} <span aria-hidden>*</span>
                      </label>
                      <input
                        id="sub-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        autoComplete="email"
                        className={field}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sub-org" className={labelCls}>
                      {t("form_organization")}
                    </label>
                    <input
                      id="sub-org"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      autoComplete="organization"
                      className={field}
                    />
                  </div>

                  <div>
                    <label htmlFor="sub-message" className={labelCls}>
                      {t("form_message")}
                    </label>
                    <textarea
                      id="sub-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={3}
                      placeholder={locale === "fr" ? "Questions ou besoins spécifiques..." : "Any questions or specific requirements..."}
                      className={`${field} resize-y`}
                    />
                  </div>

                  <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
                    {!submitting && <Send className="w-4 h-4" aria-hidden />}
                    {t("form_submit")}
                  </Button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* What's included */}
      <Section index={1} eyebrow={t("premium")} title={t("whats_included")} intro={t("whats_included_desc")}>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 max-w-3xl">
          {[t("included_1"), t("included_2"), t("included_3"), t("included_4"), t("included_5"), t("included_6")].map(
            (item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" aria-hidden />
                {item}
              </li>
            )
          )}
        </ul>
      </Section>

      {/* FAQ */}
      <Section index={2} eyebrow="FAQ" title={t("faq_title")} size="prose">
        <div className="divide-y divide-glass-border border-y border-glass-border">
          {[1, 2, 3, 4].map((i) => (
            <details key={i} className="group">
              <summary className="min-h-11 py-5 cursor-pointer list-none flex items-center justify-between gap-4 hover:text-gold transition-colors [&::-webkit-details-marker]:hidden">
                <span className="font-medium">{t(`faq_q${i}`)}</span>
                <Plus className="w-4 h-4 text-gold shrink-0 transition-transform group-open:rotate-45" aria-hidden />
              </summary>
              <p className="pb-5 text-text-secondary text-sm leading-relaxed">{t(`faq_a${i}`)}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section size="prose">
        <h2 className="h-section mb-4">{t("cta_title")}</h2>
        <p className="lede mb-7">{t("cta_desc")}</p>
        <Link href="/publications" className={buttonClass("secondary", "lg")}>
          {t("browse_publications")}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </Section>
    </>
  );
}

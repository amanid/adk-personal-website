"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Brain, Database, Server, GraduationCap, BarChart3, CheckCircle, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceRequestSchema, ServiceRequestInput } from "@/lib/validations";
import { useState } from "react";

const serviceCards = [
  {
    icon: Brain,
    titleKey: "consulting",
    descKey: "consulting_desc",
    features: [
      "AI Readiness Assessment",
      "Data Strategy Roadmap",
      "Technology Selection",
      "Implementation Planning",
    ],
  },
  {
    icon: Database,
    titleKey: "architecture",
    descKey: "architecture_desc",
    features: [
      "Lakehouse Architecture",
      "Data Pipeline Design",
      "Cloud Migration",
      "Data Governance",
    ],
  },
  {
    icon: Server,
    titleKey: "mlops",
    descKey: "mlops_desc",
    features: [
      "ML Pipeline Development",
      "Model Deployment",
      "Monitoring & Optimization",
      "A/B Testing Frameworks",
    ],
  },
  {
    icon: GraduationCap,
    titleKey: "training",
    descKey: "training_desc",
    features: [
      "Custom Curricula",
      "Hands-on Workshops",
      "Team Upskilling",
      "Executive Briefings",
    ],
  },
  {
    icon: BarChart3,
    titleKey: "statistics",
    descKey: "statistics_desc",
    features: [
      "Statistical Inference & Modeling",
      "Econometric Analysis",
      "Survey Design & Sampling",
      "Impact Evaluation",
    ],
  },
];

export default function ServicesPage() {
  const t = useTranslations("services");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceRequestInput>({
    resolver: zodResolver(serviceRequestSchema),
  });

  const onSubmit = async (data: ServiceRequestInput) => {
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
        reset();
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  };

  return (
    <div className="section-padding">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-text-secondary text-lg">{t("subtitle")}</p>
        </motion.div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {serviceCards.map((service, index) => (
            <motion.div
              key={service.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:border-gold/30 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <service.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold">{t(service.titleKey)}</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                {t(service.descKey)}
              </p>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-text-secondary text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-gold shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Request Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 max-w-2xl mx-auto"
        >
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-gold mb-2">
            {t("request_title")}
          </h2>
          <p className="text-text-secondary text-sm mb-6">{t("request_desc")}</p>

          {submitted && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {t("form.success")}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {t("form.error")}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  {t("form.name")} *
                </label>
                <input
                  {...register("name")}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  {t("form.email")} *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  {t("form.company")}
                </label>
                <input
                  {...register("company")}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  {t("form.service_type")} *
                </label>
                <select
                  {...register("serviceType")}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                >
                  <option value="CONSULTING">AI & Data Consulting</option>
                  <option value="AI_DEVELOPMENT">AI Development</option>
                  <option value="TRAINING">Training & Workshops</option>
                  <option value="SPEAKING">Speaking Engagements</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                {t("form.description")} *
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors resize-none"
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                {t("form.budget")}
              </label>
              <input
                {...register("budget")}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                placeholder="e.g., $5,000 - $10,000"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "..." : t("form.submit")}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

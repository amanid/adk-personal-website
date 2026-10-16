"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Brain, Database, Server, GraduationCap, BarChart3, Code2, ArrowRight, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceRequestSchema, ServiceRequestInput } from "@/lib/validations";
import { Container, Section } from "@/components/ui/Section";
import { Button, ButtonLink } from "@/components/ui/Button";

const serviceCards = [
  { icon: BarChart3, titleKey: "statistics", descKey: "statistics_desc" },
  { icon: Brain, titleKey: "consulting", descKey: "consulting_desc" },
  { icon: Database, titleKey: "architecture", descKey: "architecture_desc" },
  { icon: Server, titleKey: "mlops", descKey: "mlops_desc" },
  { icon: Code2, titleKey: "fullstack", descKey: "fullstack_desc" },
  { icon: GraduationCap, titleKey: "training", descKey: "training_desc" },
];

const field =
  "w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
  "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";
const labelCls = "block text-sm text-text-secondary mb-1.5";
const errCls = "text-danger text-xs mt-1.5";

export default function ServicesClient() {
  const t = useTranslations("services");
  const tNav = useTranslations("nav");
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
    setError(false);
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

  // aria wiring for a field and its error message.
  const a11y = (name: keyof ServiceRequestInput) =>
    errors[name]
      ? { "aria-invalid": true as const, "aria-describedby": `svc-${name}-error` }
      : {};

  return (
    <>
      <Container className="pt-14 pb-4 md:pt-20">
        <p className="eyebrow mb-4">{tNav("services")}</p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
        <p className="lede max-w-2xl">{t("subtitle")}</p>
      </Container>

      <Section className="pt-10 md:pt-14 border-t-0">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {serviceCards.map((service) => (
            <li key={service.titleKey} className="card p-6 md:p-7">
              <div className="flex items-center gap-3 mb-3">
                <service.icon className="w-5 h-5 text-gold shrink-0" aria-hidden />
                <h2 className="font-display text-2xl leading-tight">{t(service.titleKey)}</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">{t(service.descKey)}</p>
              <ul className="flex flex-wrap gap-2">
                {(t.raw(`card_features.${service.titleKey}`) as string[]).map((feature) => (
                  <li
                    key={feature}
                    className="text-xs text-text-secondary px-2.5 py-1 rounded-[var(--radius-sm)] border border-glass-border"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <ButtonLink href="/consulting" variant="secondary" size="md" className="group">
            {t("view_packages")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
          </ButtonLink>
        </div>
      </Section>

      <Section id="request" title={t("request_title")} intro={t("request_desc")} size="prose">
        <div className="card p-6 md:p-8">
          {submitted && (
            <p
              role="status"
              className="mb-5 p-3 rounded-[var(--radius-md)] bg-success/10 border border-success/30 text-success text-sm"
            >
              {t("form.success")}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mb-5 p-3 rounded-[var(--radius-md)] bg-danger/10 border border-danger/30 text-danger text-sm"
            >
              {t("form.error")}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="svc-name" className={labelCls}>
                  {t("form.name")} <span aria-hidden>*</span>
                </label>
                <input id="svc-name" {...register("name")} autoComplete="name" required className={field} {...a11y("name")} />
                {errors.name && <p id="svc-name-error" className={errCls}>{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="svc-email" className={labelCls}>
                  {t("form.email")} <span aria-hidden>*</span>
                </label>
                <input
                  id="svc-email"
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  required
                  className={field}
                  {...a11y("email")}
                />
                {errors.email && <p id="svc-email-error" className={errCls}>{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="svc-company" className={labelCls}>
                  {t("form.company")}
                </label>
                <input id="svc-company" {...register("company")} autoComplete="organization" className={field} />
              </div>
              <div>
                <label htmlFor="svc-type" className={labelCls}>
                  {t("form.service_type")} <span aria-hidden>*</span>
                </label>
                <select id="svc-type" {...register("serviceType")} required className={field} {...a11y("serviceType")}>
                  <option value="CONSULTING">{t("service_options.consulting")}</option>
                  <option value="STATISTICS">{t("service_options.statistics")}</option>
                  <option value="AI_DEVELOPMENT">{t("service_options.ai_development")}</option>
                  <option value="DATA_ENGINEERING">{t("service_options.data_engineering")}</option>
                  <option value="FULLSTACK">{t("service_options.fullstack")}</option>
                  <option value="TRAINING">{t("service_options.training")}</option>
                  <option value="SPEAKING">{t("service_options.speaking")}</option>
                  <option value="OTHER">{t("service_options.other")}</option>
                </select>
                {errors.serviceType && (
                  <p id="svc-serviceType-error" className={errCls}>{errors.serviceType.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="svc-description" className={labelCls}>
                {t("form.description")} <span aria-hidden>*</span>
              </label>
              <textarea
                id="svc-description"
                {...register("description")}
                rows={5}
                required
                className={`${field} resize-y`}
                {...a11y("description")}
              />
              {errors.description && (
                <p id="svc-description-error" className={errCls}>{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="svc-budget" className={labelCls}>
                {t("form.budget")}
              </label>
              <input
                id="svc-budget"
                {...register("budget")}
                className={field}
                placeholder={t("form.budget_placeholder")}
              />
            </div>

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
              {!isSubmitting && <Send className="w-4 h-4" aria-hidden />}
              {t("form.submit")}
            </Button>
          </form>
        </div>
      </Section>
    </>
  );
}

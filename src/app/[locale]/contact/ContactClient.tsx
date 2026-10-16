"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, MapPin, Linkedin, Github, Send, Phone, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, ContactInput } from "@/lib/validations";
import { Container } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

const field =
  "w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
  "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";
const labelCls = "block text-sm text-text-secondary mb-1.5";
const errCls = "text-danger text-xs mt-1.5";
const linkCls =
  "inline-flex items-center min-h-11 text-text-primary hover:text-gold transition-colors break-all";

const socials = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/amanidieudonnekonan", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/amanid", label: "GitHub" },
];

export default function ContactClient() {
  const t = useTranslations("contact");
  const tNav = useTranslations("nav");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactInput) => {
    setError(false);
    try {
      const res = await fetch("/api/contact", {
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

  const a11y = (name: keyof ContactInput) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `contact-${name}-error` } : {};

  return (
    <Container className="pt-14 pb-20 md:pt-20 md:pb-28">
      <p className="eyebrow mb-4">{tNav("contact")}</p>
      <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
      <p className="lede max-w-2xl mb-12 md:mb-16">{t("subtitle")}</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Form */}
        <div className="lg:col-span-7 lg:order-2">
          <div className="card p-6 md:p-8">
            {/* Live regions stay mounted so screen readers announce changes. */}
            <div role="status" aria-live="polite">
              {submitted && (
                <p className="mb-5 p-3 rounded-[var(--radius-md)] bg-success/10 border border-success/30 text-success text-sm">
                  {t("form.success")}
                </p>
              )}
            </div>
            <div role="alert">
              {error && (
                <p className="mb-5 p-3 rounded-[var(--radius-md)] bg-danger/10 border border-danger/30 text-danger text-sm">
                  {t("form.error")}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className={labelCls}>
                    {t("form.name")} <span aria-hidden>*</span>
                  </label>
                  <input
                    id="contact-name"
                    {...register("name")}
                    autoComplete="name"
                    required
                    className={field}
                    {...a11y("name")}
                  />
                  {errors.name && (
                    <p id="contact-name-error" className={errCls}>
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="contact-email" className={labelCls}>
                    {t("form.email")} <span aria-hidden>*</span>
                  </label>
                  <input
                    id="contact-email"
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    required
                    className={field}
                    {...a11y("email")}
                  />
                  {errors.email && (
                    <p id="contact-email-error" className={errCls}>
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className={labelCls}>
                  {t("form.subject")} <span aria-hidden>*</span>
                </label>
                <input id="contact-subject" {...register("subject")} required className={field} {...a11y("subject")} />
                {errors.subject && (
                  <p id="contact-subject-error" className={errCls}>
                    {errors.subject.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-message" className={labelCls}>
                  {t("form.message")} <span aria-hidden>*</span>
                </label>
                <textarea
                  id="contact-message"
                  {...register("message")}
                  rows={7}
                  required
                  className={`${field} resize-y`}
                  {...a11y("message")}
                />
                {errors.message && (
                  <p id="contact-message-error" className={errCls}>
                    {errors.message.message}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
                {!isSubmitting && <Send className="w-4 h-4" aria-hidden />}
                {t("form.submit")}
              </Button>
            </form>
          </div>
        </div>

        {/* Details */}
        <aside className="lg:col-span-5 lg:order-1">
          <ul className="divide-y divide-glass-border border-y border-glass-border">
            <li className="py-5 flex gap-4">
              <Mail className="w-5 h-5 text-gold shrink-0 mt-3" aria-hidden />
              <div className="min-w-0">
                <p className="eyebrow text-text-muted">{t("info.email")}</p>
                <div className="flex flex-col">
                  <a href="mailto:amanidieudonnekonan@gmail.com" className={linkCls}>
                    amanidieudonnekonan@gmail.com
                  </a>
                  <a href="mailto:amani_dieudonne@yahoo.fr" className={linkCls}>
                    amani_dieudonne@yahoo.fr
                  </a>
                </div>
              </div>
            </li>

            <li className="py-5 flex gap-4">
              <Phone className="w-5 h-5 text-gold shrink-0 mt-3" aria-hidden />
              <div>
                <p className="eyebrow text-text-muted">{t("info.phone")}</p>
                <div className="flex flex-col font-mono tabular-nums">
                  <a href="tel:+2250747882235" className={linkCls}>
                    (+225) 07 47 88 22 35
                  </a>
                  <a href="tel:+2250506841919" className={linkCls}>
                    (+225) 05 06 84 19 19
                  </a>
                </div>
              </div>
            </li>

            <li className="py-5 flex gap-4">
              <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="eyebrow text-text-muted mb-1">{t("info.location")}</p>
                <div className="text-text-primary">{t("info.location_value")}</div>
              </div>
            </li>

            <li className="py-5">
              <p className="eyebrow text-text-muted mb-2">{t("info.social")}</p>
              <div className="flex gap-2">
                {socials.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-11 h-11 rounded-[var(--radius-md)] border border-glass-border flex items-center justify-center text-text-secondary hover:text-gold hover:bg-[var(--hover-wash)] transition-colors"
                  >
                    <social.icon className="w-5 h-5" aria-hidden />
                  </a>
                ))}
              </div>
            </li>
          </ul>

          <p className="text-sm text-text-secondary mt-8">
            {t("consulting_hint")}{" "}
            <Link
              href="/consulting"
              className="inline-flex items-center gap-1 min-h-11 text-gold hover:text-gold-light transition-colors"
            >
              {t("consulting_link")}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          </p>
        </aside>
      </div>
    </Container>
  );
}

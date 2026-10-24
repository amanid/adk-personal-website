"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "loading" | "success" | "error" | "already_subscribed";

const field =
  "w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
  "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";

/**
 * `footer` (default): the stacked form in the site footer.
 * `inline`: a card under an article or report, pitched as the monthly brief —
 * the same /api/subscribe double opt-in, one field.
 */
export default function NewsletterSignup({ variant = "footer" }: { variant?: "footer" | "inline" }) {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      if (res.status === 409) {
        setStatus("already_subscribed");
        return;
      }

      if (!res.ok) throw new Error();

      setStatus("success");
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
    }
  };

  const inline = variant === "inline";
  const ids = inline ? { email: "brief-email", name: "brief-name" } : { email: "newsletter-email", name: "newsletter-name" };

  return (
    <div className={inline ? "my-8 card p-6 md:p-8" : "mb-4"}>
      {inline ? (
        <>
          <p className="eyebrow mb-3">{t("brief_eyebrow")}</p>
          <h2 className="font-display text-2xl md:text-3xl leading-tight mb-2">{t("brief_title")}</h2>
          <p className="text-text-secondary mb-5 max-w-xl">{t("brief_subtitle")}</p>
        </>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-text-primary mb-2">{t("title")}</h3>
          <p className="text-sm text-text-muted mb-3">{t("subtitle")}</p>
        </>
      )}

      {status === "success" ? (
        <p
          role="status"
          className="flex items-start gap-2 px-3 py-2.5 rounded-[var(--radius-md)] bg-success/10 border border-success/30 text-success text-sm"
        >
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{t("success")}</span>
        </p>
      ) : status === "already_subscribed" ? (
        <p
          role="status"
          className="flex items-start gap-2 px-3 py-2.5 rounded-[var(--radius-md)] bg-gold/10 border border-gold/30 text-gold text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{t("already")}</span>
        </p>
      ) : status === "error" ? (
        <div>
          <p
            role="alert"
            className="flex items-start gap-2 px-3 py-2.5 mb-2 rounded-[var(--radius-md)] bg-danger/10 border border-danger/30 text-danger text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <span>{t("error")}</span>
          </p>
          <Button type="button" variant="ghost" onClick={() => setStatus("idle")} className="px-3 text-gold">
            {t("subscribe")}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={inline ? "flex flex-col sm:flex-row gap-2 max-w-xl" : "space-y-2"}>
          <label htmlFor={ids.email} className="sr-only">
            {t("placeholder_email")}
          </label>
          <input
            id={ids.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder_email")}
            autoComplete="email"
            required
            className={field}
          />
          {!inline && (
            <>
              <label htmlFor={ids.name} className="sr-only">
                {t("placeholder_name")}
              </label>
              <input
                id={ids.name}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("placeholder_name")}
                autoComplete="name"
                className={field}
              />
            </>
          )}
          <Button type="submit" loading={status === "loading"} className={inline ? "shrink-0" : "w-full"}>
            {status === "loading" ? t("subscribing") : t("subscribe")}
          </Button>
        </form>
      )}
    </div>
  );
}

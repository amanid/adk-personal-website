"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Mail, CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function FindOrdersPage() {
  const t = useTranslations("store");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || sending) return;
    setSending(true);
    try {
      await fetch("/api/store/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Response is intentionally opaque; show the same confirmation regardless.
    } finally {
      setSending(false);
      setSent(true);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 md:py-20">
      <Link
        href="/store"
        className="inline-flex items-center gap-1 min-h-11 text-sm text-text-secondary hover:text-gold transition-colors mb-6"
      >
        <ChevronLeft aria-hidden="true" className="w-4 h-4" />
        {t("backToStore")}
      </Link>

      <div className="card p-6 sm:p-8">
        {sent ? (
          <div role="status">
            <CheckCircle2 aria-hidden="true" className="w-10 h-10 mb-4 text-success" />
            <h1 className="font-display text-3xl leading-tight mb-2">{t("lookupSentTitle")}</h1>
            <p className="text-text-secondary">{t("lookupSentDesc")}</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-6"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              {t("lookupTryAnother")}
            </Button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl leading-tight mb-2">{t("lookupTitle")}</h1>
            <p className="text-text-secondary mb-6">{t("lookupDesc")}</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="lookup-email" className="block text-sm text-text-secondary mb-1.5">
                  {t("email")}
                </label>
                <div className="relative">
                  <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="lookup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    aria-describedby="lookup-privacy"
                    className="w-full min-h-11 pl-9 pr-3 rounded-[var(--radius-md)] bg-navy border border-glass-border focus:border-gold outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" loading={sending} disabled={!emailValid}>
                {sending ? t("lookupSending") : t("lookupSubmit")}
              </Button>
            </form>
            <p id="lookup-privacy" className="text-sm text-text-secondary mt-4">{t("lookupPrivacy")}</p>
          </>
        )}
      </div>
    </div>
  );
}

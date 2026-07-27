"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Mail, Search, CheckCircle2, ChevronLeft } from "lucide-react";

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
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/store"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-gold transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {t("backToStore")}
      </Link>

      <div className="glass rounded-2xl p-8">
        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h1 className="text-2xl font-bold mb-2">{t("lookupSentTitle")}</h1>
            <p className="text-text-secondary">{t("lookupSentDesc")}</p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-6 text-sm text-gold hover:underline"
            >
              {t("lookupTryAnother")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-6 h-6 text-gold" />
              <h1 className="text-2xl font-bold">{t("lookupTitle")}</h1>
            </div>
            <p className="text-text-secondary text-sm mb-6">{t("lookupDesc")}</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="lookup-email" className="block text-sm text-text-secondary mb-1">
                  {t("email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="lookup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!emailValid || sending}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all disabled:opacity-50"
              >
                {sending ? t("lookupSending") : t("lookupSubmit")}
              </button>
            </form>
            <p className="text-xs text-text-secondary mt-4">{t("lookupPrivacy")}</p>
          </>
        )}
      </div>
    </div>
  );
}

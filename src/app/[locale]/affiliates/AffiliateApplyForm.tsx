"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import { postJson } from "@/components/payments/PaymentPanel";

const METHODS = [
  ["PAYPAL", "PayPal"],
  ["WAVE", "Wave"],
  ["ORANGE_MONEY", "Orange Money"],
  ["DJAMO", "Djamo"],
] as const;

export default function AffiliateApplyForm() {
  const t = useTranslations("affiliate");
  const locale = useLocale();
  const [f, setF] = useState({ name: "", email: "", website: "", pitch: "", payoutMethod: "PAYPAL", payoutDetails: "", agree: false });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = "w-full px-3 py-2.5 rounded-md bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm";

  if (done) {
    return (
      <div className="glass p-6">
        <CheckCircle2 className="w-8 h-8 text-green-400 mb-3" />
        <h2 className="text-lg font-semibold mb-1">{t("sent_title")}</h2>
        <p className="text-sm text-text-secondary">{t("sent_text")}</p>
      </div>
    );
  }

  return (
    <form
      className="glass p-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await postJson("/api/affiliates/apply", { ...f, agree: f.agree || undefined, locale: locale === "fr" ? "fr" : "en" }, t("error"));
          setDone(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : t("error"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-lg font-semibold">{t("form_title")}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-text-secondary mb-1">{t("name")}</span>
          <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" className={input} />
        </label>
        <label className="block">
          <span className="block text-xs text-text-secondary mb-1">{t("email")}</span>
          <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" className={input} />
        </label>
      </div>
      <label className="block">
        <span className="block text-xs text-text-secondary mb-1">{t("website")}</span>
        <input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className={input} />
      </label>
      <label className="block">
        <span className="block text-xs text-text-secondary mb-1">{t("pitch")}</span>
        <textarea required rows={3} value={f.pitch} placeholder={t("pitch_placeholder")} onChange={(e) => setF({ ...f, pitch: e.target.value })} className={input} />
      </label>
      <div className="grid sm:grid-cols-[10rem_1fr] gap-3">
        <label className="block">
          <span className="block text-xs text-text-secondary mb-1">{t("payout_method")}</span>
          <select value={f.payoutMethod} onChange={(e) => setF({ ...f, payoutMethod: e.target.value })} className={input}>
            {METHODS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-text-secondary mb-1">{t("payout_details")}</span>
          <input required value={f.payoutDetails} onChange={(e) => setF({ ...f, payoutDetails: e.target.value })} className={input} />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" required checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} className="mt-1 accent-gold" />
        {t("agree")}
      </label>
      {error && <p className="text-sm text-red-400 border border-red-400/30 rounded-md p-3">{error}</p>}
      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gold text-charcoal font-semibold hover:bg-gold-light disabled:opacity-50">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy ? t("sending") : t("submit")}
      </button>
    </form>
  );
}

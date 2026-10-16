"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  const input =
    "w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
    "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";
  const labelCls = "block text-sm text-text-secondary mb-1.5";

  if (done) {
    return (
      <div role="status" className="card p-6 md:p-8">
        <CheckCircle2 className="w-8 h-8 text-success mb-3" aria-hidden />
        <h2 className="font-display text-2xl mb-2">{t("sent_title")}</h2>
        <p className="text-sm text-text-secondary">{t("sent_text")}</p>
      </div>
    );
  }

  return (
    <form
      className="card p-6 md:p-8 space-y-5"
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
      <h2 className="font-display text-2xl">{t("form_title")}</h2>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="aff-name" className={labelCls}>{t("name")}</label>
          <input id="aff-name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" className={input} />
        </div>
        <div>
          <label htmlFor="aff-email" className={labelCls}>{t("email")}</label>
          <input id="aff-email" required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="aff-website" className={labelCls}>{t("website")}</label>
        <input id="aff-website" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} autoComplete="url" className={input} />
      </div>
      <div>
        <label htmlFor="aff-pitch" className={labelCls}>{t("pitch")}</label>
        <textarea id="aff-pitch" required rows={3} value={f.pitch} placeholder={t("pitch_placeholder")} onChange={(e) => setF({ ...f, pitch: e.target.value })} className={`${input} resize-y`} />
      </div>
      <div className="grid sm:grid-cols-[10rem_1fr] gap-5">
        <div>
          <label htmlFor="aff-method" className={labelCls}>{t("payout_method")}</label>
          <select id="aff-method" value={f.payoutMethod} onChange={(e) => setF({ ...f, payoutMethod: e.target.value })} className={input}>
            {METHODS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="aff-details" className={labelCls}>{t("payout_details")}</label>
          <input id="aff-details" required value={f.payoutDetails} onChange={(e) => setF({ ...f, payoutDetails: e.target.value })} className={input} />
        </div>
      </div>
      <label htmlFor="aff-agree" className="flex items-start gap-3 text-sm min-h-11 cursor-pointer">
        <input id="aff-agree" type="checkbox" required checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} className="mt-0.5 w-5 h-5 accent-gold shrink-0" />
        {t("agree")}
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-[var(--radius-md)] p-3">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={busy}>
        {busy ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}

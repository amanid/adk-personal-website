"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import { postJson } from "@/components/payments/PaymentPanel";

export default function ApiKeyForm() {
  const t = useTranslations("developers");
  const [f, setF] = useState({ name: "", email: "", useCase: "", agree: false });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = "w-full px-3 py-2.5 rounded-md bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm";

  if (done) {
    return (
      <p className="glass p-5 text-sm flex gap-2 max-w-xl">
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        {t("sent")}
      </p>
    );
  }
  return (
    <form
      className="glass p-6 space-y-3 max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await postJson("/api/developers/keys", { ...f, agree: f.agree || undefined }, t("error"));
          setDone(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : t("error"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block"><span className="block text-xs text-text-secondary mb-1">{t("name")}</span><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} /></label>
        <label className="block"><span className="block text-xs text-text-secondary mb-1">{t("email")}</span><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={input} /></label>
      </div>
      <label className="block"><span className="block text-xs text-text-secondary mb-1">{t("use_case")}</span><textarea required rows={3} value={f.useCase} onChange={(e) => setF({ ...f, useCase: e.target.value })} className={input} /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} className="mt-1 accent-gold" />{t("agree")}</label>
      {error && <p className="text-sm text-red-400 border border-red-400/30 rounded-md p-3">{error}</p>}
      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gold text-charcoal font-semibold disabled:opacity-50">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy ? t("sending") : t("submit")}
      </button>
    </form>
  );
}

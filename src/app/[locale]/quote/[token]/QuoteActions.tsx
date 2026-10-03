"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Check, Loader2 } from "lucide-react";
import PaymentPanel, { postJson } from "@/components/payments/PaymentPanel";
import type { StartedCheckout } from "@/components/store/PayPalCheckout";

interface Props {
  token: string;
  canDecide: boolean;
  due: { stage: "DEPOSIT" | "BALANCE"; amountCents: number } | null;
  currency: string;
}

/** Accept / decline a sent quote, then pay whatever is due on it. */
export default function QuoteActions({ token, canDecide, due, currency }: Props) {
  const t = useTranslations("quote");
  const router = useRouter();
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  const base = `/api/quotes/${encodeURIComponent(token)}`;
  const input =
    "w-full px-3 py-2.5 rounded-md bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  };

  if (canDecide) {
    return (
      <div className="glass p-6 md:p-8 mt-6">
        {!declining ? (
          <>
            <h2 className="text-lg font-semibold mb-2">{t("accept_title")}</h2>
            <p className="text-sm text-text-secondary mb-4">{t("accept_help")}</p>
            <label className="block mb-3">
              <span className="block text-xs text-text-secondary mb-1">{t("your_name")}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={input} />
            </label>
            <label className="flex items-start gap-2 text-sm mb-5">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
              {t("agree")}
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !agree || name.trim().length < 2}
                onClick={() => run(() => postJson(`${base}/accept`, { name, agree: true }, t("error")))}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gold text-charcoal font-semibold hover:bg-gold-light disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {busy ? t("accepting") : t("accept")}
              </button>
              <button
                type="button"
                onClick={() => setDeclining(true)}
                className="px-5 py-3 rounded-md border border-glass-border text-text-secondary hover:text-text-primary"
              >
                {t("decline")}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3">{t("decline_title")}</h2>
            <label className="block mb-4">
              <span className="block text-xs text-text-secondary mb-1">{t("decline_reason")}</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={2000} className={input} />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => postJson(`${base}/decline`, { reason }, t("error")))}
                className="px-5 py-2.5 rounded-md border border-red-400/40 text-red-400 disabled:opacity-40"
              >
                {t("decline_confirm")}
              </button>
              <button type="button" onClick={() => setDeclining(false)} className="px-5 py-2.5 rounded-md border border-glass-border">
                {t("cancel")}
              </button>
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-400 border border-red-400/30 rounded-md p-3 mt-4">{error}</p>}
      </div>
    );
  }

  if (due) {
    return (
      <div className="mt-6">
        <PaymentPanel
          title={due.stage === "DEPOSIT" ? t("pay_deposit") : t("pay_balance")}
          amountCents={due.amountCents}
          currency={currency}
          validate={() => true}
          startPayPal={() => postJson<StartedCheckout>(`${base}/pay`, { payment: "PAYPAL" }, t("error"))}
          submitManual={(provider, reference) =>
            postJson<{ receiptToken: string }>(`${base}/pay`, { payment: "MANUAL", provider, reference }, t("error")).then(
              (d) => d.receiptToken
            )
          }
          onDone={(receiptToken) => router.push(`/store/receipt/${receiptToken}`)}
        />
      </div>
    );
  }

  return null;
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
    "w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
    "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";
  const labelCls = "block text-sm text-text-secondary mb-1.5";

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
      <div className="card p-6 md:p-8 mt-6">
        {!declining ? (
          <>
            <h2 className="font-display text-2xl mb-2">{t("accept_title")}</h2>
            <p className="text-sm text-text-secondary mb-5">{t("accept_help")}</p>
            <div className="mb-4">
              <label htmlFor="quote-name" className={labelCls}>
                {t("your_name")}
              </label>
              <input
                id="quote-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className={input}
              />
            </div>
            <label htmlFor="quote-agree" className="flex items-start gap-3 text-sm mb-6 min-h-11 cursor-pointer">
              <input
                id="quote-agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-gold shrink-0"
              />
              {t("agree")}
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                size="lg"
                loading={busy}
                disabled={!agree || name.trim().length < 2}
                onClick={() => run(() => postJson(`${base}/accept`, { name, agree: true }, t("error")))}
              >
                {!busy && <Check className="w-4 h-4" aria-hidden />}
                {busy ? t("accepting") : t("accept")}
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={() => setDeclining(true)}>
                {t("decline")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl mb-4">{t("decline_title")}</h2>
            <div className="mb-5">
              <label htmlFor="quote-reason" className={labelCls}>
                {t("decline_reason")}
              </label>
              <textarea
                id="quote-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={2000}
                className={`${input} resize-y`}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                loading={busy}
                onClick={() => run(() => postJson(`${base}/decline`, { reason }, t("error")))}
                className="text-danger border-danger/40 hover:border-danger"
              >
                {t("decline_confirm")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDeclining(false)}>
                {t("cancel")}
              </Button>
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-[var(--radius-md)] p-3 mt-4">
            {error}
          </p>
        )}
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

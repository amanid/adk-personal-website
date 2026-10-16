"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Smartphone, Copy, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import { MOBILE_MONEY_NUMBER, MOBILE_MONEY_PROVIDERS } from "@/lib/mobile-money";

interface MobileMoneyCheckoutProps {
  amountCents: number;
  currency: string;
  onValidate?: () => boolean;
  /**
   * Place the pending order on the server for this payment method and return
   * its receipt token; throw an Error with a buyer-safe message on failure.
   */
  submitOrder: (provider: string, reference: string) => Promise<string>;
  onPlaced: (receiptToken: string) => void;
}

export default function MobileMoneyCheckout({
  amountCents,
  currency,
  onValidate,
  submitOrder,
  onPlaced,
}: MobileMoneyCheckoutProps) {
  const t = useTranslations("store");
  const [provider, setProvider] = useState<string>(MOBILE_MONEY_PROVIDERS[0].id);
  const [reference, setReference] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(MOBILE_MONEY_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const placeOrder = async () => {
    setError(null);
    if (onValidate && !onValidate()) return;
    setPlacing(true);
    try {
      onPlaced(await submitOrder(provider, reference));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t("mmError"));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-glass-border p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Smartphone aria-hidden="true" className="w-4 h-4 text-gold" />
        {t("mmTitle")}
      </div>

      {/* Provider */}
      <div>
        <p id="mm-provider-label" className="block text-sm text-text-secondary mb-1.5">{t("mmProvider")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="mm-provider-label">
          {MOBILE_MONEY_PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                aria-pressed={active}
                style={
                  active
                    ? { borderColor: p.color, backgroundColor: `${p.color}22`, color: p.color }
                    : undefined
                }
                className={`inline-flex items-center gap-2 min-h-11 px-3.5 rounded-[var(--radius-md)] text-sm border font-medium transition-colors ${
                  active ? "" : "border-glass-border text-text-secondary hover:border-gold/50"
                }`}
              >
                <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Number + amount */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
        <div className="rounded-[var(--radius-md)] bg-navy border border-glass-border p-3">
          <div className="text-xs text-text-secondary">{t("mmNumber")}</div>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="font-mono tabular-nums font-medium break-all">{MOBILE_MONEY_NUMBER}</span>
            <button
              type="button"
              onClick={copyNumber}
              className="flex items-center justify-center min-h-11 min-w-11 -my-2 -mr-2 rounded-[var(--radius-md)] text-text-muted hover:text-text-primary hover:bg-[var(--hover-wash)] shrink-0"
              aria-label={t("mmCopyNumber")}
            >
              {copied ? (
                <Check aria-hidden="true" className="w-4 h-4 text-success" />
              ) : (
                <Copy aria-hidden="true" className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] bg-navy border border-glass-border p-3">
          <div className="text-xs text-text-secondary">{t("mmAmount")}</div>
          <div className="font-mono tabular-nums font-medium">{formatPrice(amountCents, currency)}</div>
        </div>
      </div>

      {/* How it works */}
      <p className="text-sm text-text-secondary">{t("mmFlowNote")}</p>

      {/* Optional reference */}
      <div>
        <label htmlFor="mm-ref" className="block text-sm text-text-secondary mb-1.5">
          {t("mmReferenceOptional")}
        </label>
        <input
          id="mm-ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={t("mmReferencePlaceholder")}
          className="w-full min-h-11 px-3 rounded-[var(--radius-md)] bg-navy border border-glass-border focus:border-gold outline-none text-sm"
        />
      </div>

      <button
        type="button"
        onClick={placeOrder}
        disabled={placing}
        className={buttonClass("primary", "lg", "w-full")}
        aria-busy={placing || undefined}
      >
        {placing ? t("mmPlacing") : t("mmPlaceOrderBtn")}
      </button>

      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-[var(--radius-md)] p-3">{error}</p>
      )}

      <p className="text-sm text-text-secondary flex items-start gap-2">
        <Check aria-hidden="true" className="w-4 h-4 text-success mt-0.5 shrink-0" />
        {t("mmManualNote")}
      </p>
    </div>
  );
}

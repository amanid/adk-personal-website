"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import { PAYPAL_ME_HANDLE, PAYPAL_RECEIVE_EMAIL, paypalMeLink } from "@/lib/paypal-direct";

interface PayPalDirectCheckoutProps {
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

/**
 * "PayPal to PayPal" checkout: the buyer sends the total straight to the
 * merchant's PayPal account, then places the order. It stays PENDING until an
 * admin confirms the transfer — the same settlement model as mobile money.
 */
export default function PayPalDirectCheckout({
  amountCents,
  currency,
  onValidate,
  submitOrder,
  onPlaced,
}: PayPalDirectCheckoutProps) {
  const t = useTranslations("store");
  const [reference, setReference] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const payLink = paypalMeLink(amountCents, currency);
  const account = PAYPAL_RECEIVE_EMAIL || (PAYPAL_ME_HANDLE ? `paypal.me/${PAYPAL_ME_HANDLE}` : "");

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(account);
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
      onPlaced(await submitOrder("PAYPAL", reference));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t("ppdError"));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-glass-border p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="font-bold text-[#0070ba] dark:text-[#4aa3e0]">PayPal</span>
        <span className="text-text-secondary">·</span>
        {t("ppdTitle")}
      </div>

      {/* Account + amount */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
        <div className="rounded-[var(--radius-md)] bg-navy border border-glass-border p-3 min-w-0">
          <div className="text-xs text-text-secondary">{t("ppdAccount")}</div>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="font-medium truncate">{account}</span>
            <button
              type="button"
              onClick={copyAccount}
              className="flex items-center justify-center min-h-11 min-w-11 -my-2 -mr-2 rounded-[var(--radius-md)] text-text-muted hover:text-text-primary hover:bg-[var(--hover-wash)] shrink-0"
              aria-label={t("ppdCopy")}
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
          <div className="text-xs text-text-secondary">{t("ppdAmount")}</div>
          <div className="font-mono tabular-nums font-medium">{formatPrice(amountCents, currency)}</div>
        </div>
      </div>

      {/* Pre-filled PayPal.me link, when a handle is configured */}
      {payLink && (
        <a
          href={payLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-[var(--radius-md)] bg-[#0070ba] text-white font-semibold hover:bg-[#005ea6] transition-colors"
        >
          {t("ppdPayButton", { amount: formatPrice(amountCents, currency) })}
          <ExternalLink aria-hidden="true" className="w-4 h-4" />
        </a>
      )}

      <div className="rounded-[var(--radius-md)] border border-success/25 bg-success/5 p-3 space-y-1.5">
        <p className="text-sm text-text-primary flex items-start gap-2">
          <ShieldCheck aria-hidden="true" className="w-4 h-4 text-success mt-0.5 shrink-0" />
          {t("ppdGoodsServices")}
        </p>
      </div>

      <p className="text-sm text-text-secondary">{t("ppdFlowNote")}</p>
      <p className="text-sm text-text-muted">{t("ppdPayNowOrLater")}</p>

      {/* Optional transaction id */}
      <div>
        <label htmlFor="ppd-ref" className="block text-sm text-text-secondary mb-1.5">
          {t("ppdReferenceOptional")}
        </label>
        <input
          id="ppd-ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={t("ppdReferencePlaceholder")}
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
        {placing ? t("ppdPlacing") : t("ppdPlaceOrderBtn")}
      </button>

      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-[var(--radius-md)] p-3">{error}</p>
      )}

      <p className="text-sm text-text-secondary flex items-start gap-2">
        <Check aria-hidden="true" className="w-4 h-4 text-success mt-0.5 shrink-0" />
        {t("ppdManualNote")}
      </p>
    </div>
  );
}

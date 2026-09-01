"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { PAYPAL_ME_HANDLE, PAYPAL_RECEIVE_EMAIL, paypalMeLink } from "@/lib/paypal-direct";

interface PayPalDirectCheckoutProps {
  email: string;
  name: string;
  amountCents: number;
  currency: string;
  couponCode?: string | null;
  onValidate?: () => boolean;
}

/**
 * "PayPal to PayPal" checkout: the buyer sends the total straight to the
 * merchant's PayPal account, then places the order. It stays PENDING until an
 * admin confirms the transfer — the same settlement model as mobile money.
 */
export default function PayPalDirectCheckout({
  email,
  name,
  amountCents,
  currency,
  couponCode,
  onValidate,
}: PayPalDirectCheckoutProps) {
  const t = useTranslations("store");
  const router = useRouter();
  const { items, clear } = useCart();
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
      const res = await fetch("/api/store/mobile-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          provider: "PAYPAL",
          reference,
          couponCode: couponCode || undefined,
          items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.receiptToken) {
        setError(data?.error || t("ppdError"));
        return;
      }
      clear();
      router.push(`/store/receipt/${data.receiptToken}`);
    } catch {
      setError(t("ppdError"));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="rounded-lg border border-glass-border p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="font-bold text-[#0070ba] dark:text-[#4aa3e0]">PayPal</span>
        <span className="text-text-secondary">·</span>
        {t("ppdTitle")}
      </div>

      {/* Account + amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-navy/50 border border-glass-border p-3 min-w-0">
          <div className="text-[11px] text-text-secondary">{t("ppdAccount")}</div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold truncate">{account}</span>
            <button
              type="button"
              onClick={copyAccount}
              className="text-text-muted hover:text-gold shrink-0"
              aria-label={t("ppdCopy")}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
        <div className="rounded-lg bg-navy/50 border border-glass-border p-3">
          <div className="text-[11px] text-text-secondary">{t("ppdAmount")}</div>
          <div className="font-semibold text-gold">{formatPrice(amountCents, currency)}</div>
        </div>
      </div>

      {/* Pre-filled PayPal.me link, when a handle is configured */}
      {payLink && (
        <a
          href={payLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0070ba] text-white font-semibold hover:bg-[#005ea6] transition-all"
        >
          {t("ppdPayButton", { amount: formatPrice(amountCents, currency) })}
          <ExternalLink className="w-4 h-4" />
        </a>
      )}

      <div className="rounded-lg border border-green-500/25 bg-green-500/5 p-3 space-y-1.5">
        <p className="text-xs text-text-primary flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
          {t("ppdGoodsServices")}
        </p>
      </div>

      <p className="text-xs text-text-secondary">{t("ppdFlowNote")}</p>
      <p className="text-xs text-text-muted">{t("ppdPayNowOrLater")}</p>

      {/* Optional transaction id */}
      <div>
        <label htmlFor="ppd-ref" className="block text-xs text-text-secondary mb-1">
          {t("ppdReferenceOptional")}
        </label>
        <input
          id="ppd-ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={t("ppdReferencePlaceholder")}
          className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
        />
      </div>

      <button
        type="button"
        onClick={placeOrder}
        disabled={placing}
        className="w-full px-5 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all disabled:opacity-50"
      >
        {placing ? t("ppdPlacing") : t("ppdPlaceOrderBtn")}
      </button>

      {error && (
        <p className="text-sm text-red-400 border border-red-400/30 rounded-lg p-3">{error}</p>
      )}

      <p className="text-xs text-text-secondary flex items-start gap-1.5">
        <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
        {t("ppdManualNote")}
      </p>
    </div>
  );
}

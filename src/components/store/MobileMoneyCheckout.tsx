"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Smartphone, Copy, Check, MessageCircle } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import {
  MOBILE_MONEY_NUMBER,
  MOBILE_MONEY_PROVIDERS,
  whatsappLink,
} from "@/lib/mobile-money";

interface MobileMoneyCheckoutProps {
  email: string;
  name: string;
  amountCents: number;
  currency: string;
  onValidate?: () => boolean;
}

export default function MobileMoneyCheckout({
  email,
  name,
  amountCents,
  currency,
  onValidate,
}: MobileMoneyCheckoutProps) {
  const t = useTranslations("store");
  const router = useRouter();
  const { items, clear } = useCart();
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
      const res = await fetch("/api/store/mobile-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          provider,
          reference,
          items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.receiptToken) {
        setError(data?.error || t("mmError"));
        return;
      }
      clear();
      router.push(`/store/receipt/${data.receiptToken}`);
    } catch {
      setError(t("mmError"));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="rounded-lg border border-glass-border p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Smartphone className="w-4 h-4 text-gold" />
        {t("mmTitle")}
      </div>

      {/* Provider */}
      <div>
        <label className="block text-xs text-text-secondary mb-1">{t("mmProvider")}</label>
        <div className="flex flex-wrap gap-2">
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
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${
                  active ? "" : "border-glass-border text-text-secondary hover:border-gold/50"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Number + amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-navy/50 border border-glass-border p-3">
          <div className="text-[11px] text-text-secondary">{t("mmNumber")}</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{MOBILE_MONEY_NUMBER}</span>
            <button
              type="button"
              onClick={copyNumber}
              className="text-text-muted hover:text-gold"
              aria-label="Copy number"
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
          <div className="text-[11px] text-text-secondary">{t("mmAmount")}</div>
          <div className="font-semibold text-gold">{formatPrice(amountCents, currency)}</div>
        </div>
      </div>

      {/* How it works */}
      <p className="text-xs text-text-secondary">{t("mmFlowNote")}</p>

      {/* Optional reference */}
      <div>
        <label htmlFor="mm-ref" className="block text-xs text-text-secondary mb-1">
          {t("mmReferenceOptional")}
        </label>
        <input
          id="mm-ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={t("mmReferencePlaceholder")}
          className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
        />
      </div>

      <button
        type="button"
        onClick={placeOrder}
        disabled={placing}
        className="w-full px-5 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all disabled:opacity-50"
      >
        {placing ? t("mmPlacing") : t("mmPlaceOrderBtn")}
      </button>

      {/* WhatsApp shortcut */}
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-green-500/40 text-green-400 font-medium hover:bg-green-500/10 transition-all"
      >
        <MessageCircle className="w-4 h-4" />
        {t("mmSendWhatsapp")}
      </a>

      {error && (
        <p className="text-sm text-red-400 border border-red-400/30 rounded-lg p-3">{error}</p>
      )}

      <p className="text-xs text-text-secondary flex items-start gap-1.5">
        <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
        {t("mmManualNote")}
      </p>
    </div>
  );
}

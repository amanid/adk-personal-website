"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, CreditCard, Smartphone, Check } from "lucide-react";
import { isPaypalCurrency } from "@/lib/currency";
import { isPaypalApiConfigured, isPaypalDirectConfigured } from "@/lib/paypal-direct";
import PayPalCheckout, { type StartedCheckout } from "@/components/store/PayPalCheckout";
import MobileMoneyCheckout from "@/components/store/MobileMoneyCheckout";
import PayPalDirectCheckout from "@/components/store/PayPalDirectCheckout";

/**
 * The payment step, shared by everything the site sells: the bookstore cart,
 * consulting bookings and quote payments. It offers the methods that can
 * actually settle the amount:
 *   - PayPal, automatic (Orders v2) when REST credentials are configured,
 *     otherwise a direct transfer confirmed by the admin;
 *   - mobile money (Wave / Djamo / Orange Money), confirmed by the admin.
 * What is being paid for is the caller's concern: it supplies the two server
 * calls, and the server prices everything.
 */
export interface PaymentPanelProps {
  amountCents: number;
  currency: string;
  /** Return false to block payment (e.g. a required field is missing). */
  validate: () => boolean;
  /** Create the pending order + PayPal order (automatic PayPal flow). */
  startPayPal: () => Promise<StartedCheckout>;
  /** Place a pending manual-payment order; resolves to its receipt token. */
  submitManual: (provider: string, reference: string) => Promise<string>;
  /** Payment captured (PayPal) or manual order placed. */
  onDone: (receiptToken: string) => void;
  title?: string;
}

export default function PaymentPanel({
  amountCents,
  currency,
  validate,
  startPayPal,
  submitManual,
  onDone,
  title,
}: PaymentPanelProps) {
  const t = useTranslations("store");
  // null until the buyer picks; until then the instant method is the default.
  const [chosen, setChosen] = useState<"paypal" | "mobile" | null>(null);

  // PayPal can't settle every currency (XOF, for one); offer it only when it can.
  const paypalCurrencyOk = isPaypalCurrency(currency);
  const paypalApi = paypalCurrencyOk && isPaypalApiConfigured();
  const paypalDirect = paypalCurrencyOk && !paypalApi && isPaypalDirectConfigured();
  const paypalAvailable = paypalApi || paypalDirect;

  const options = [
    {
      id: "mobile" as const,
      icon: Smartphone,
      label: t("payMobileMoney"),
      desc: t("payMobileMoneyDesc"),
      badge: t("manualConfirm"),
    },
    ...(paypalAvailable
      ? [
          {
            id: "paypal" as const,
            icon: CreditCard,
            label: t("payPaypal"),
            desc: paypalApi ? t("payPaypalDesc") : t("payPaypalDirectDesc"),
            badge: paypalApi ? t("instant") : t("manualConfirm"),
          },
        ]
      : []),
  ];
  const method = chosen ?? (paypalAvailable ? "paypal" : "mobile");
  const active = method === "paypal" && !paypalAvailable ? "mobile" : method;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-gold" />
        <h2 className="text-lg font-semibold">{title ?? t("secureCheckout")}</h2>
      </div>
      <p className="text-xs text-text-secondary mb-2">{t("payMethod")}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const isActive = active === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setChosen(opt.id)}
              aria-pressed={isActive}
              className={`h-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                isActive ? "border-gold/60 bg-gold/10 ring-1 ring-gold/40" : "border-glass-border hover:border-gold/40"
              }`}
            >
              <span
                className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-gold/20 text-gold" : "bg-navy/60 text-text-secondary"
                }`}
              >
                <opt.icon className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{opt.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-navy/60 text-text-secondary">
                    {opt.badge}
                  </span>
                </span>
                <span className="block text-xs text-text-secondary mt-0.5">{opt.desc}</span>
              </span>
              {isActive && (
                <span className="mt-1 w-4 h-4 rounded-full bg-gold shrink-0 flex items-center justify-center">
                  <Check className="w-3 h-3 text-charcoal" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {active === "paypal" && paypalApi ? (
          <PayPalCheckout currency={currency} onValidate={validate} startCheckout={startPayPal} onPaid={onDone} />
        ) : active === "paypal" ? (
          <PayPalDirectCheckout
            amountCents={amountCents}
            currency={currency}
            onValidate={validate}
            submitOrder={submitManual}
            onPlaced={onDone}
          />
        ) : (
          <MobileMoneyCheckout
            amountCents={amountCents}
            currency={currency}
            onValidate={validate}
            submitOrder={submitManual}
            onPlaced={onDone}
          />
        )}
      </div>

      <p className="text-[11px] text-text-secondary mt-3 flex items-start gap-1.5">
        <Lock className="w-3 h-3 mt-0.5 shrink-0" />
        {t("encryptedNote")}
      </p>
    </div>
  );
}

/** POST JSON and return the parsed body, throwing the server's message on failure. */
export async function postJson<T>(url: string, body: unknown, fallbackError: string): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && typeof data.error === "string" && data.error) || fallbackError);
  return data as T;
}

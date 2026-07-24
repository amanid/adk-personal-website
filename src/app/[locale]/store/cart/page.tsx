"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import QuantitySelector from "@/components/store/QuantitySelector";
import PayPalCheckout from "@/components/store/PayPalCheckout";
import MobileMoneyCheckout from "@/components/store/MobileMoneyCheckout";
import { Trash2, ShoppingCart, BookOpen, Lock, ShieldCheck, RefreshCw, Mail, CreditCard, Smartphone, Check } from "lucide-react";

export default function CartPage() {
  const { items, subtotalCents, setQuantity, removeItem, hydrated } = useCart();
  const t = useTranslations("store");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [method, setMethod] = useState<"paypal" | "mobile">("paypal");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-text-secondary">
        {t("loadingCart")}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="glass rounded-xl p-12 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gold/40" />
          <h1 className="text-2xl font-bold mb-2">{t("emptyTitle")}</h1>
          <p className="text-text-secondary mb-6">{t("emptySubtitle")}</p>
          <Link
            href="/store"
            className="inline-block px-5 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all"
          >
            {t("goToStore")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-8">
        {t("yourCart")}
      </h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.bookId} className="glass rounded-xl p-4 flex gap-4">
              <Link
                href={`/store/${item.slug}`}
                className="relative w-16 h-20 shrink-0 rounded-md overflow-hidden bg-navy/50 flex items-center justify-center"
              >
                {item.coverUrl ? (
                  <Image
                    src={item.coverUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <BookOpen className="w-6 h-6 text-gold/30" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/store/${item.slug}`}
                  className="font-medium hover:text-gold transition-colors line-clamp-2"
                >
                  {item.title}
                </Link>
                <p className="text-sm text-gold mt-1">{formatPrice(item.priceCents)}</p>
                <div className="flex items-center gap-4 mt-3">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(q) => setQuantity(item.bookId, q)}
                    size="sm"
                  />
                  <button
                    onClick={() => removeItem(item.bookId)}
                    className="text-text-secondary hover:text-red-400 transition-colors flex items-center gap-1 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("remove")}
                  </button>
                </div>
              </div>
              <div className="text-right font-semibold">
                {formatPrice(item.priceCents * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary + checkout */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">{t("orderSummary")}</h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">{t("subtotal")}</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-3 mt-3 border-t border-glass-border">
              <span>{t("total")}</span>
              <span className="text-gold">{formatPrice(subtotalCents)}</span>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm text-text-secondary mb-1">
                  {t("email")} <span className="text-gold">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={t("emailPlaceholder")}
                  aria-invalid={touched && !emailValid}
                  className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
                  required
                />
                {touched && !emailValid && (
                  <p className="text-xs text-red-400 mt-1">{t("emailInvalid")}</p>
                )}
                <p className="text-xs text-text-secondary mt-1">{t("emailHint")}</p>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm text-text-secondary mb-1">
                  {t("name")}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
                />
              </div>
            </div>

            {/* Payment method — selectable cards */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-gold" />
                <p className="text-sm font-medium">{t("secureCheckout")}</p>
              </div>
              <p className="text-xs text-text-secondary mb-2">{t("payMethod")}</p>
              <div className="space-y-2">
                {(
                  [
                    {
                      id: "paypal" as const,
                      icon: CreditCard,
                      label: t("payPaypal"),
                      desc: t("payPaypalDesc"),
                      badge: t("instant"),
                    },
                    {
                      id: "mobile" as const,
                      icon: Smartphone,
                      label: t("payMobileMoney"),
                      desc: t("payMobileMoneyDesc"),
                      badge: t("manualConfirm"),
                    },
                  ]
                ).map((opt) => {
                  const active = method === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMethod(opt.id)}
                      aria-pressed={active}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        active
                          ? "border-gold/60 bg-gold/10 ring-1 ring-gold/40"
                          : "border-glass-border hover:border-gold/40"
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? "bg-gold/20 text-gold" : "bg-navy/60 text-text-secondary"
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-sm">{opt.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-navy/60 text-text-secondary">
                            {opt.badge}
                          </span>
                        </span>
                        <span className="block text-xs text-text-secondary mt-0.5">{opt.desc}</span>
                      </span>
                      <span
                        className={`mt-1 w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                          active ? "border-gold bg-gold" : "border-glass-border"
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-charcoal" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              {method === "paypal" ? (
                <PayPalCheckout
                  email={email}
                  name={name}
                  disabled={!emailValid}
                  onValidate={() => {
                    setTouched(true);
                    return emailValid;
                  }}
                />
              ) : (
                <MobileMoneyCheckout
                  email={email}
                  name={name}
                  amountCents={subtotalCents}
                  onValidate={() => {
                    setTouched(true);
                    return emailValid;
                  }}
                />
              )}
            </div>

            <p className="text-[11px] text-text-secondary mt-3 flex items-start gap-1.5">
              <Lock className="w-3 h-3 mt-0.5 shrink-0" />
              {t("encryptedNote")}
            </p>

            {/* Trust & policy */}
            <div className="mt-6 pt-4 border-t border-glass-border space-y-2 text-xs text-text-secondary">
              <p className="font-medium text-text-primary">{t("policyTitle")}</p>
              <p className="flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                {t("policySecure")}
              </p>
              <p className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                {t("policyDownloads")}
              </p>
              <p className="flex items-start gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-gold/70 mt-0.5 shrink-0" />
                {t("policyRefund")}
              </p>
              <p className="flex items-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gold/70 mt-0.5 shrink-0" />
                {t("policyPrivacy")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import QuantitySelector from "@/components/store/QuantitySelector";
import PaymentPanel, { postJson } from "@/components/payments/PaymentPanel";
import type { StartedCheckout } from "@/components/store/PayPalCheckout";
import { Trash2, ShoppingCart, BookOpen, Lock, ShieldCheck, RefreshCw, Mail, Gift, Download, Tag, X } from "lucide-react";

export default function CartPage() {
  const { items, subtotalCents, currency, setQuantity, removeItem, clear, hydrated } = useCart();
  const t = useTranslations("store");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [freePlacing, setFreePlacing] = useState(false);
  const [freeError, setFreeError] = useState<string | null>(null);

  // Remember buyer details across visits so returning buyers don't retype.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adk_bookstore_buyer");
      if (raw) {
        const b = JSON.parse(raw);
        if (typeof b?.email === "string") setEmail(b.email);
        if (typeof b?.name === "string") setName(b.name);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("adk_bookstore_buyer", JSON.stringify({ email, name }));
    } catch {
      // ignore
    }
  }, [email, name]);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // Two ways to take PayPal, both of which need a currency PayPal can settle
  // (XOF, for one, it cannot):
  //   - the automatic Orders v2 flow, which unlocks downloads instantly but
  //     needs REST credentials and a Business account;
  //   - "PayPal to PayPal", a direct transfer confirmed by an admin, which
  //     needs neither.
  // Prefer the automatic flow when it is configured; otherwise fall back to the
  // direct transfer. Offering neither is better than offering an option that
  // can only fail once the buyer picks it.
  // Effective total after any coupon; a coupon may bring a paid cart down to free.
  const totalCents = Math.max(0, subtotalCents - discountCents);
  const isFree = totalCents === 0;

  const applyCouponCode = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError(null);
    setCouponLoading(true);
    try {
      const res = await fetch("/api/store/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.valid) {
        setAppliedCode(null);
        setDiscountCents(0);
        setCouponError(data?.error || t("couponInvalid"));
        return;
      }
      setAppliedCode(data.code);
      setDiscountCents(data.discountCents);
      setCouponInput(data.code);
    } catch {
      setCouponError(t("couponInvalid"));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCode(null);
    setDiscountCents(0);
    setCouponInput("");
    setCouponError(null);
  };

  // A stale coupon (from before a cart edit) would show a wrong discount; drop it
  // whenever the cart contents change. The server is authoritative at checkout.
  const cartSig = items.map((i) => `${i.bookId}:${i.quantity}`).join(",");
  const cartLines = items.map((i) => ({ bookId: i.bookId, quantity: i.quantity }));
  useEffect(() => {
    setAppliedCode((code) => {
      if (code) {
        setDiscountCents(0);
        setCouponError(null);
      }
      return null;
    });
  }, [cartSig]);

  const placeFreeOrder = async () => {
    setTouched(true);
    if (!emailValid) return;
    setFreeError(null);
    setFreePlacing(true);
    try {
      const res = await fetch("/api/store/free-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          couponCode: appliedCode || undefined,
          items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.receiptToken) {
        setFreeError(data?.error || t("freeError"));
        return;
      }
      clear();
      router.push(`/store/receipt/${data.receiptToken}`);
    } catch {
      setFreeError(t("freeError"));
    } finally {
      setFreePlacing(false);
    }
  };

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


  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-8">
        {t("yourCart")}
      </h1>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        {/* ── Left: items, details, payment ── */}
        <div className="space-y-6 min-w-0">
          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.bookId} className="glass rounded-xl p-4 flex gap-4">
                <Link
                  href={`/store/${item.slug}`}
                  className="relative w-16 h-20 shrink-0 rounded-md overflow-hidden bg-navy/50 flex items-center justify-center"
                >
                  {item.coverUrl ? (
                    <Image src={item.coverUrl} alt="" fill sizes="64px" className="object-cover" />
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
                  <p className="text-sm text-gold mt-1">{item.priceCents === 0 ? t("free") : formatPrice(item.priceCents, item.currency)}</p>
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
                  {item.priceCents === 0 ? t("free") : formatPrice(item.priceCents * item.quantity, item.currency)}
                </div>
              </div>
            ))}
          </div>

          {/* Your details */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold" />
              {t("email")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
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
                  className={inputClass}
                  required
                />
                {touched && !emailValid && (
                  <p className="text-xs text-red-400 mt-1">{t("emailInvalid")}</p>
                )}
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
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-2">{t("emailHint")}</p>
          </div>

          {/* Free order — no payment needed */}
          {isFree ? (
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold">{t("freeTitle")}</h2>
              </div>
              <p className="text-sm text-text-secondary mb-4">{t("freeDesc")}</p>
              <button
                type="button"
                onClick={placeFreeOrder}
                disabled={freePlacing || !emailValid}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {freePlacing ? t("freeProcessing") : t("getForFree")}
              </button>
              {touched && !emailValid && (
                <p className="text-xs text-red-400 mt-2">{t("emailInvalid")}</p>
              )}
              {freeError && (
                <p className="text-sm text-red-400 border border-red-400/30 rounded-lg p-3 mt-3">
                  {freeError}
                </p>
              )}
            </div>
          ) : (
          /* Payment */
          <PaymentPanel
            amountCents={totalCents}
            currency={currency}
            validate={() => {
              setTouched(true);
              return emailValid;
            }}
            startPayPal={() =>
              postJson<StartedCheckout>(
                "/api/store/checkout",
                { email, name, couponCode: appliedCode || undefined, items: cartLines },
                t("paypalError")
              )
            }
            submitManual={(provider, reference) =>
              postJson<{ receiptToken: string }>(
                "/api/store/mobile-order",
                { email, name, provider, reference, couponCode: appliedCode || undefined, items: cartLines },
                t("mmError")
              ).then((d) => d.receiptToken)
            }
            onDone={(receiptToken) => {
              clear();
              router.push(`/store/receipt/${receiptToken}`);
            }}
          />
          )}
        </div>

        {/* ── Right: sticky summary + trust ── */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">{t("orderSummary")}</h2>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.bookId} className="flex justify-between gap-2">
                  <span className="text-text-secondary truncate">
                    {item.title}
                    <span className="text-text-muted"> ×{item.quantity}</span>
                  </span>
                  <span className="shrink-0">{item.priceCents === 0 ? t("free") : formatPrice(item.priceCents * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>
            {/* Coupon — only meaningful for a paid cart */}
            {subtotalCents > 0 && (
              <div className="mt-4 pt-3 border-t border-glass-border">
                {appliedCode ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-sm text-green-400 min-w-0">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium truncate">{appliedCode}</span>
                      <span className="text-text-secondary">{t("couponApplied")}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-text-muted hover:text-red-400 shrink-0"
                      aria-label={t("couponRemove")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="coupon" className="block text-xs text-text-secondary mb-1">
                      {t("couponLabel")}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCouponCode();
                          }
                        }}
                        placeholder={t("couponPlaceholder")}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm uppercase"
                      />
                      <button
                        type="button"
                        onClick={applyCouponCode}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-3 py-2 rounded-lg border border-gold/50 text-gold text-sm font-medium hover:bg-gold/10 transition-all disabled:opacity-50 shrink-0"
                      >
                        {couponLoading ? t("couponApplying") : t("couponApply")}
                      </button>
                    </div>
                  </>
                )}
                {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
              </div>
            )}

            <div className="flex justify-between text-sm mt-4 pt-3 border-t border-glass-border">
              <span className="text-text-secondary">{t("subtotal")}</span>
              <span>{subtotalCents === 0 ? t("free") : formatPrice(subtotalCents, currency)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-sm mt-1 text-green-400">
                <span>{t("discount")}</span>
                <span>−{formatPrice(discountCents, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 mt-1">
              <span>{t("total")}</span>
              <span className="text-gold">{isFree ? t("free") : formatPrice(totalCents, currency)}</span>
            </div>
          </div>

          {/* Trust & policy */}
          <div className="glass rounded-xl p-6 space-y-2 text-xs text-text-secondary">
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
  );
}

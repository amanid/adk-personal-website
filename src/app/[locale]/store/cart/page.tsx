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
import { Button, ButtonLink } from "@/components/ui/Button";

export default function CartPage() {
  const { items, subtotalCents, currency, setQuantity, removeItem, clear, hydrated } = useCart();
  // What the server prices: the line, its quantity and any chosen amount.
  const cartLines = items.map((i) => ({
    bookId: i.bookId,
    quantity: i.quantity,
    ...(i.amountCents !== undefined ? { amountCents: i.amountCents } : {}),
  }));
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
          items: cartLines,
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
          items: cartLines,
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
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-text-secondary" role="status">
        {t("loadingCart")}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <p className="eyebrow mb-4">{t("cart")}</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">{t("emptyTitle")}</h1>
        <p className="lede mt-4">{t("emptySubtitle")}</p>
        <ButtonLink href="/store" size="lg" className="mt-8">
          <ShoppingCart aria-hidden="true" className="w-4 h-4" />
          {t("goToStore")}
        </ButtonLink>
      </div>
    );
  }

  const inputClass =
    "w-full min-h-11 px-3 rounded-[var(--radius-md)] bg-navy border border-glass-border focus:border-gold outline-none text-sm";
  const emailError = touched && !emailValid;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <header className="mb-10">
        <p className="eyebrow mb-3">{t("secureCheckout")}</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">{t("yourCart")}</h1>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        {/* ── Left: items, details, payment ── */}
        <div className="space-y-8 min-w-0">
          {/* Items */}
          <ul className="border-t border-glass-border">
            {items.map((item) => (
              <li key={item.bookId} className="py-5 border-b border-glass-border flex gap-4">
                <Link
                  href={`/store/${item.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="relative w-16 h-[5.5rem] shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-navy border border-glass-border flex items-center justify-center"
                >
                  {item.coverUrl ? (
                    <Image src={item.coverUrl} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-text-muted" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/store/${item.slug}`}
                      className="font-display text-lg leading-snug hover:text-gold transition-colors line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    <span className="font-mono tabular-nums font-medium shrink-0">
                      {item.priceCents === 0 ? t("free") : formatPrice(item.priceCents * item.quantity, item.currency)}
                    </span>
                  </div>
                  <p className="font-mono tabular-nums text-sm text-text-secondary mt-1">
                    {item.priceCents === 0 ? t("free") : formatPrice(item.priceCents, item.currency)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(q) => setQuantity(item.bookId, q)}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.bookId)}
                      className="inline-flex items-center gap-1.5 min-h-11 sm:min-h-9 px-2 -ml-2 rounded-[var(--radius-md)] text-sm text-text-secondary hover:text-danger hover:bg-[var(--hover-wash)] transition-colors"
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                      {t("remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Your details */}
          <section className="card p-6" aria-labelledby="cart-details-heading">
            <h2 id="cart-details-heading" className="font-display text-xl mb-4 flex items-center gap-2">
              <Mail aria-hidden="true" className="w-4 h-4 text-gold" />
              {t("email")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm text-text-secondary mb-1.5">
                  {t("email")} <span className="text-gold" aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={t("emailPlaceholder")}
                  aria-invalid={emailError}
                  aria-describedby={emailError ? "email-error email-hint" : "email-hint"}
                  className={inputClass}
                  required
                />
                {emailError && (
                  <p id="email-error" className="text-sm text-danger mt-1.5">{t("emailInvalid")}</p>
                )}
              </div>
              <div>
                <label htmlFor="name" className="block text-sm text-text-secondary mb-1.5">
                  {t("name")}
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className={inputClass}
                />
              </div>
            </div>
            <p id="email-hint" className="text-sm text-text-secondary mt-3">{t("emailHint")}</p>
          </section>

          {/* Free order: no payment needed */}
          {isFree ? (
            <section className="card p-6" aria-labelledby="free-heading">
              <div className="flex items-center gap-2 mb-2">
                <Gift aria-hidden="true" className="w-5 h-5 text-gold" />
                <h2 id="free-heading" className="font-display text-xl">{t("freeTitle")}</h2>
              </div>
              <p className="text-sm text-text-secondary mb-5">{t("freeDesc")}</p>
              <Button
                type="button"
                size="lg"
                onClick={placeFreeOrder}
                loading={freePlacing}
                disabled={!emailValid}
                className="w-full"
              >
                {!freePlacing && <Download aria-hidden="true" className="w-4 h-4" />}
                {freePlacing ? t("freeProcessing") : t("getForFree")}
              </Button>
              {emailError && (
                <p className="text-sm text-danger mt-2">{t("emailInvalid")}</p>
              )}
              {freeError && (
                <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-[var(--radius-md)] p-3 mt-3">
                  {freeError}
                </p>
              )}
            </section>
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
          <section className="card-feature card p-6" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="font-display text-xl mb-4">{t("orderSummary")}</h2>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.bookId} className="flex justify-between gap-2">
                  <span className="text-text-secondary truncate">
                    {item.title}
                    <span className="font-mono tabular-nums text-text-muted"> ×{item.quantity}</span>
                  </span>
                  <span className="font-mono tabular-nums shrink-0">{item.priceCents === 0 ? t("free") : formatPrice(item.priceCents * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>
            {/* Coupon: only meaningful for a paid cart */}
            {subtotalCents > 0 && (
              <div className="mt-4 pt-4 border-t border-glass-border">
                {appliedCode ? (
                  <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-success/10 border border-success/30 pl-3">
                    <span className="flex items-center gap-1.5 text-sm text-success min-w-0">
                      <Tag aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono font-medium truncate">{appliedCode}</span>
                      <span className="text-text-secondary">{t("couponApplied")}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="flex items-center justify-center min-h-11 min-w-11 text-text-muted hover:text-danger shrink-0"
                      aria-label={t("couponRemove")}
                    >
                      <X aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="coupon" className="block text-sm text-text-secondary mb-1.5">
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
                        aria-invalid={couponError ? true : undefined}
                        aria-describedby={couponError ? "coupon-error" : undefined}
                        className={`${inputClass} flex-1 min-w-0 uppercase font-mono`}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={applyCouponCode}
                        loading={couponLoading}
                        disabled={!couponInput.trim()}
                        className="shrink-0"
                      >
                        {couponLoading ? t("couponApplying") : t("couponApply")}
                      </Button>
                    </div>
                  </>
                )}
                {couponError && <p id="coupon-error" role="alert" className="text-sm text-danger mt-2">{couponError}</p>}
              </div>
            )}

            <div className="flex justify-between text-sm mt-4 pt-4 border-t border-glass-border">
              <span className="text-text-secondary">{t("subtotal")}</span>
              <span className="font-mono tabular-nums">{subtotalCents === 0 ? t("free") : formatPrice(subtotalCents, currency)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-sm mt-1 text-success">
                <span>{t("discount")}</span>
                <span className="font-mono tabular-nums">−{formatPrice(discountCents, currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 mt-2">
              <span className="font-medium">{t("total")}</span>
              <span className="font-mono tabular-nums text-2xl font-medium">{isFree ? t("free") : formatPrice(totalCents, currency)}</span>
            </div>
          </section>

          {/* Trust & policy */}
          <div className="card p-6 space-y-2.5 text-sm text-text-secondary">
            <p className="eyebrow text-text-muted mb-3">{t("policyTitle")}</p>
            <p className="flex items-start gap-2">
              <Lock aria-hidden="true" className="w-4 h-4 text-success mt-0.5 shrink-0" />
              {t("policySecure")}
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck aria-hidden="true" className="w-4 h-4 text-success mt-0.5 shrink-0" />
              {t("policyDownloads")}
            </p>
            <p className="flex items-start gap-2">
              <RefreshCw aria-hidden="true" className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              {t("policyRefund")}
            </p>
            <p className="flex items-start gap-2">
              <Mail aria-hidden="true" className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              {t("policyPrivacy")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

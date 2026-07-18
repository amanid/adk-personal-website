"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import QuantitySelector from "@/components/store/QuantitySelector";
import PayPalCheckout from "@/components/store/PayPalCheckout";
import { Trash2, ShoppingCart, BookOpen, Lock, ShieldCheck } from "lucide-react";

export default function CartPage() {
  const { items, subtotalCents, setQuantity, removeItem, hydrated } = useCart();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-text-secondary">
        Loading cart…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="glass rounded-xl p-12 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gold/40" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-text-secondary mb-6">Browse the bookstore to find your next read.</p>
          <Link
            href="/store"
            className="inline-block px-5 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all"
          >
            Go to bookstore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-8">Your cart</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.bookId} className="glass rounded-xl p-4 flex gap-4">
              <Link
                href={`/store/${item.slug}`}
                className="w-16 h-20 shrink-0 rounded-md overflow-hidden bg-navy/50 flex items-center justify-center"
              >
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />
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
                    Remove
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
            <h2 className="text-lg font-semibold mb-4">Order summary</h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-3 mt-3 border-t border-glass-border">
              <span>Total</span>
              <span className="text-gold">{formatPrice(subtotalCents)}</span>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm text-text-secondary mb-1">
                  Email <span className="text-gold">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
                  required
                />
                {touched && !emailValid && (
                  <p className="text-xs text-red-400 mt-1">Please enter a valid email.</p>
                )}
                <p className="text-xs text-text-secondary mt-1">
                  Your receipt and secure download links are sent here.
                </p>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm text-text-secondary mb-1">
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
                />
              </div>
            </div>

            <div className="mt-6">
              <PayPalCheckout
                email={email}
                name={name}
                disabled={!emailValid}
                onValidate={() => {
                  setTouched(true);
                  return emailValid;
                }}
              />
            </div>

            <div className="mt-4 space-y-1.5 text-xs text-text-secondary">
              <p className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-green-400" />
                Payments processed securely by PayPal.
              </p>
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                Downloads unlock only after confirmed payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

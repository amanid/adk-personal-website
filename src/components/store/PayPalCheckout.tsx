"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useCart } from "@/lib/cart-context";

// Minimal typing for the PayPal Buttons SDK we use.
interface PayPalButtonsConfig {
  style?: Record<string, string>;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}
interface PayPalNamespace {
  Buttons: (config: PayPalButtonsConfig) => { render: (el: HTMLElement) => Promise<void> };
}
declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadPayPalSdk(clientId: string, currency: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=${encodeURIComponent(currency)}&intent=capture&disable-funding=credit`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("Failed to load PayPal SDK"));
    };
    document.body.appendChild(script);
  });
  return sdkPromise;
}

interface PayPalCheckoutProps {
  email: string;
  name: string;
  currency?: string;
  disabled?: boolean;
  /** Return false to block starting a payment (e.g. invalid email). */
  onValidate?: () => boolean;
}

export default function PayPalCheckout({
  email,
  name,
  currency = "USD",
  disabled = false,
  onValidate,
}: PayPalCheckoutProps) {
  const { items, clear } = useCart();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Keep the latest values available to the SDK callbacks without re-rendering buttons.
  const stateRef = useRef({ email, name, items });
  stateRef.current = { email, name, items };

  // Our internal order id captured during createOrder, used by onApprove.
  const orderIdRef = useRef<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadPayPalSdk(clientId, currency)
      .then(() => {
        if (cancelled || !containerRef.current || !window.paypal) return;
        containerRef.current.innerHTML = "";

        window.paypal
          .Buttons({
            style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
            createOrder: async () => {
              setError(null);
              if (onValidate && !onValidate()) {
                throw new Error("Please complete the required fields");
              }
              const res = await fetch("/api/store/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: stateRef.current.email,
                  name: stateRef.current.name,
                  items: stateRef.current.items.map((i) => ({
                    bookId: i.bookId,
                    quantity: i.quantity,
                  })),
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Checkout failed");
              orderIdRef.current = data.orderId as string;
              return data.paypalOrderId as string;
            },
            onApprove: async () => {
              const res = await fetch("/api/store/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: orderIdRef.current }),
              });
              const data = await res.json();
              if (!res.ok) {
                setError(data.error || "Payment could not be verified");
                return;
              }
              clear();
              router.push(`/store/receipt/${data.receiptToken}`);
            },
            onError: (err) => {
              console.error("PayPal error:", err);
              setError("Something went wrong with PayPal. Please try again.");
            },
            onCancel: () => setError(null),
          })
          .render(containerRef.current)
          .then(() => !cancelled && setReady(true))
          .catch(() => {});
      })
      .catch(() => setError("Unable to load PayPal. Please refresh and try again."));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, currency]);

  if (!clientId) {
    return (
      <p className="text-sm text-amber-400 border border-amber-400/30 rounded-lg p-3">
        Payments are not configured yet. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID to enable checkout.
      </p>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className={disabled ? "opacity-40 pointer-events-none" : ""}
        aria-busy={!ready}
      />
      {!ready && !error && (
        <p className="text-sm text-text-secondary text-center py-2">
          Loading secure PayPal checkout…
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400 border border-red-400/30 rounded-lg p-3 mt-2">{error}</p>
      )}
    </div>
  );
}

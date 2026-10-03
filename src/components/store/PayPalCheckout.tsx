"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

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

export interface StartedCheckout {
  /** Our Order id. */
  orderId: string;
  paypalOrderId: string;
}

interface PayPalCheckoutProps {
  currency?: string;
  disabled?: boolean;
  /** Return false to block starting a payment (e.g. invalid email). */
  onValidate?: () => boolean;
  /**
   * Create the pending Order and its PayPal order on the server. What is being
   * bought (a cart, a booking, a quote deposit) is the caller's business; the
   * server always prices it, never this component.
   */
  startCheckout: () => Promise<StartedCheckout>;
  /** Called with the receipt token once the payment is captured and verified. */
  onPaid: (receiptToken: string) => void;
}

export default function PayPalCheckout({
  currency = "USD",
  disabled = false,
  onValidate,
  startCheckout,
  onPaid,
}: PayPalCheckoutProps) {
  const t = useTranslations("store");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Keep the latest callbacks available to the SDK without re-rendering buttons.
  const callbacksRef = useRef({ startCheckout, onPaid, onValidate });
  callbacksRef.current = { startCheckout, onPaid, onValidate };

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
              const { onValidate: validate, startCheckout: start } = callbacksRef.current;
              if (validate && !validate()) {
                throw new Error(t("completeFields"));
              }
              try {
                const started = await start();
                orderIdRef.current = started.orderId;
                return started.paypalOrderId;
              } catch (e) {
                setError(e instanceof Error ? e.message : t("paypalError"));
                throw e;
              }
            },
            onApprove: async (approval) => {
              const res = await fetch("/api/store/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: orderIdRef.current,
                  paypalOrderId: approval.orderID,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setError(data.error || t("paymentUnverified"));
                return;
              }
              callbacksRef.current.onPaid(data.receiptToken);
            },
            onError: (err) => {
              console.error("PayPal error:", err);
              setError(t("paypalError"));
            },
            onCancel: () => setError(null),
          })
          .render(containerRef.current)
          .then(() => !cancelled && setReady(true))
          .catch(() => {});
      })
      .catch(() => setError(t("paypalLoadError")));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, currency]);

  if (!clientId) {
    return (
      <p className="text-sm text-amber-400 border border-amber-400/30 rounded-lg p-3">
        {t("paypalUnavailable")}
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
        <p className="text-sm text-text-secondary text-center py-2">{t("loadingCheckout")}</p>
      )}
      {error && (
        <p className="text-sm text-red-400 border border-red-400/30 rounded-lg p-3 mt-2">{error}</p>
      )}
    </div>
  );
}

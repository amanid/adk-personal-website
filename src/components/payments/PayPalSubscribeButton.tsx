"use client";

import { useEffect, useRef, useState } from "react";

/*
 * PayPal subscription button. Loads the JS SDK with vault=true &
 * intent=subscription (as PayPal documents for subscriptions) under its own
 * namespace, so it can never clash with the store's capture-intent SDK.
 */
interface SubscriptionButtons {
  Buttons: (cfg: {
    style?: Record<string, string>;
    createSubscription: (data: unknown, actions: { subscription: { create: (b: Record<string, unknown>) => Promise<string> } }) => Promise<string>;
    onApprove: (data: { subscriptionID?: string }) => Promise<void>;
    onError?: (err: unknown) => void;
  }) => { render: (el: HTMLElement) => Promise<void>; close?: () => void };
}
declare global {
  interface Window {
    paypalSubscriptions?: SubscriptionButtons;
  }
}

let sdk: Promise<void> | null = null;
function loadSdk(clientId: string, currency: string): Promise<void> {
  if (window.paypalSubscriptions) return Promise.resolve();
  if (sdk) return sdk;
  sdk = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription&currency=${encodeURIComponent(currency)}`;
    s.setAttribute("data-namespace", "paypalSubscriptions");
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdk = null;
      reject(new Error("Failed to load PayPal"));
    };
    document.body.appendChild(s);
  });
  return sdk;
}

export default function PayPalSubscribeButton({
  planId,
  userId,
  currency = "USD",
  onActivated,
  labels,
}: {
  planId: string;
  /** Sent as custom_id; the server checks it against the signed-in user. */
  userId: string;
  currency?: string;
  onActivated: () => void;
  labels: { loading: string; error: string; verifying: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "verifying" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    let buttons: { close?: () => void } | null = null;
    loadSdk(clientId, currency)
      .then(() => {
        if (cancelled || !ref.current || !window.paypalSubscriptions) return;
        ref.current.innerHTML = "";
        const b = window.paypalSubscriptions.Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "subscribe" },
          createSubscription: (_data, actions) => actions.subscription.create({ plan_id: planId, custom_id: userId }),
          onApprove: async (data) => {
            setState("verifying");
            const res = await fetch("/api/subscription/paypal/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subscriptionId: data.subscriptionID }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
              setState("error");
              setMessage(body.error || labels.error);
              return;
            }
            onActivated();
          },
          onError: () => {
            setState("error");
            setMessage(labels.error);
          },
        });
        buttons = b;
        return b.render(ref.current).then(() => !cancelled && setState("ready"));
      })
      .catch(() => {
        setState("error");
        setMessage(labels.error);
      });
    return () => {
      cancelled = true;
      buttons?.close?.();
    };
    // Re-render the button when the plan changes (tier or billing switch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, planId, userId, currency]);

  return (
    <div>
      <div ref={ref} className={state === "verifying" ? "opacity-40 pointer-events-none" : ""} />
      {state === "loading" && <p className="text-sm text-text-secondary text-center py-2">{labels.loading}</p>}
      {state === "verifying" && <p className="text-sm text-text-secondary text-center py-2">{labels.verifying}</p>}
      {message && <p className="text-sm text-red-400 border border-red-400/30 rounded-md p-3 mt-2">{message}</p>}
    </div>
  );
}

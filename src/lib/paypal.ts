/**
 * PayPal REST integration (Orders v2) — server-side only.
 *
 * Uses the REST API directly (no SDK dependency) mirroring the lazy-env pattern
 * in `src/lib/stripe.ts`. Never expose PAYPAL_CLIENT_SECRET to the client; only
 * NEXT_PUBLIC_PAYPAL_CLIENT_ID is safe in the browser.
 */

function getBaseUrl(): string {
  // Local testing against a mock PayPal; ignored in production builds.
  if (process.env.NODE_ENV !== "production" && process.env.PAYPAL_API_BASE) {
    return process.env.PAYPAL_API_BASE;
  }
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function getCredentials(): { clientId: string; secret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error("PayPal is not configured (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)");
  }
  return { clientId, secret };
}

/** Convert integer cents to a PayPal money string, e.g. 1999 -> "19.99". */
export function centsToMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Convert a PayPal money string back to integer cents, e.g. "19.99" -> 1999. */
export function moneyToCents(value: string): number {
  return Math.round(parseFloat(value) * 100);
}

async function getAccessToken(): Promise<string> {
  const { clientId, secret } = getCredentials();
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

interface CreateOrderParams {
  amountCents: number;
  currency: string;
  referenceId: string;
  description?: string;
}

/** Create a PayPal order (intent CAPTURE) for a digital-goods purchase. */
export async function createPayPalOrder({
  amountCents,
  currency,
  referenceId,
  description,
}: CreateOrderParams): Promise<{ id: string; status: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          // custom_id propagates to capture & refund webhook events, letting us
          // map PayPal notifications back to our Order reliably.
          custom_id: referenceId,
          description: description?.slice(0, 127),
          amount: {
            currency_code: currency,
            value: centsToMoney(amountCents),
          },
        },
      ],
      application_context: {
        brand_name: "KONAN Amani Dieudonné — Bookstore",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id: string; status: string };
  return data;
}

export interface PayPalCapture {
  status: string; // COMPLETED, DECLINED, PENDING, ...
  captureId: string | null;
  amountCents: number | null;
  currency: string | null;
  payerEmail: string | null;
}

/** Capture an approved PayPal order and return the normalized capture result. */
export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCapture> {
  const token = await getAccessToken();

  const res = await fetch(
    `${getBaseUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = (await res.json()) as {
    status?: string;
    payer?: { email_address?: string };
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          id: string;
          status: string;
          amount?: { value: string; currency_code: string };
        }>;
      };
    }>;
  };

  if (!res.ok) {
    throw new Error(`PayPal capture failed (${res.status}): ${JSON.stringify(data)}`);
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: capture?.status || data.status || "UNKNOWN",
    captureId: capture?.id || null,
    amountCents: capture?.amount ? moneyToCents(capture.amount.value) : null,
    currency: capture?.amount?.currency_code || null,
    payerEmail: data.payer?.email_address || null,
  };
}

interface WebhookVerifyParams {
  authAlgo: string | null;
  certUrl: string | null;
  transmissionId: string | null;
  transmissionSig: string | null;
  transmissionTime: string | null;
  /** The raw request body, parsed to JSON. */
  event: unknown;
}

/**
 * Verify a PayPal webhook signature via the REST verification endpoint.
 * Returns true only when PayPal responds with verification_status === "SUCCESS".
 */
export async function verifyPayPalWebhook({
  authAlgo,
  certUrl,
  transmissionId,
  transmissionSig,
  transmissionTime,
  event,
}: WebhookVerifyParams): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return false;
  }

  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: event,
    }),
    cache: "no-store",
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

// ── Subscriptions (Catalog Products v1 + Billing v1) ─────────────────────────
// Field names follow PayPal's published schemas: product type is one of
// PHYSICAL | DIGITAL | SERVICE; a plan needs product_id, name, billing_cycles
// and payment_preferences; subscription status is one of APPROVAL_PENDING,
// APPROVED, ACTIVE, SUSPENDED, CANCELLED, EXPIRED.

async function paypalApi<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Ask for the full resource back (create calls default to minimal).
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!res.ok) throw new Error(`PayPal ${method} ${path} failed (${res.status}): ${text.slice(0, 500)}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

export function createCatalogProduct(name: string, description: string, homeUrl: string) {
  return paypalApi<{ id: string }>("/v1/catalogs/products", "POST", {
    name: name.slice(0, 127),
    description: description.slice(0, 256),
    type: "DIGITAL",
    home_url: homeUrl,
  });
}

export function createBillingPlan(p: {
  productId: string;
  name: string;
  intervalUnit: "MONTH" | "YEAR";
  amountCents: number;
  currency: string;
}) {
  return paypalApi<{ id: string; status: string }>("/v1/billing/plans", "POST", {
    product_id: p.productId,
    name: p.name.slice(0, 127),
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: p.intervalUnit, interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // renews until cancelled
        pricing_scheme: { fixed_price: { value: centsToMoney(p.amountCents), currency_code: p.currency } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CANCEL",
      payment_failure_threshold: 3,
    },
  });
}

export interface PayPalSubscription {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  plan_id: string;
  custom_id?: string;
  billing_info?: { next_billing_time?: string; last_payment?: { time?: string } };
}

export function getBillingSubscription(id: string) {
  return paypalApi<PayPalSubscription>(`/v1/billing/subscriptions/${encodeURIComponent(id)}`, "GET");
}

export function cancelBillingSubscription(id: string, reason: string) {
  return paypalApi<void>(`/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, "POST", {
    reason: reason.slice(0, 128),
  });
}

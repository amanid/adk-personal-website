/**
 * Pro plan billing for API keys, through PayPal Subscriptions. As with the
 * research subscriptions, nothing from the browser is trusted: every change
 * is re-read from PayPal and must be on the Pro plan and carry the key's id.
 */
import { prisma } from "./prisma";
import { cancelBillingSubscription, createBillingPlan, createCatalogProduct, getBillingSubscription } from "./paypal";
import { API_SETTING_KEYS, getApiSettings } from "./data-api";

const PRODUCT_KEY = "private.api.paypalProductId";

/** Create (or re-create at a new price) the PayPal plan for API Pro. */
export async function setupApiProPlan(priceCents: number, homeUrl: string): Promise<string> {
  let productId = (await prisma.siteSetting.findUnique({ where: { key: PRODUCT_KEY } }))?.value;
  if (!productId) {
    productId = (await createCatalogProduct("Data & Research API — Pro", "API access to publications and datasets", homeUrl)).id;
    await prisma.siteSetting.upsert({ where: { key: PRODUCT_KEY }, update: { value: productId }, create: { key: PRODUCT_KEY, value: productId } });
  }
  const plan = await createBillingPlan({ productId, name: "Data API Pro — monthly", intervalUnit: "MONTH", amountCents: priceCents, currency: "USD" });
  const writes = {
    [API_SETTING_KEYS.proPlanId]: plan.id,
    [API_SETTING_KEYS.proPriceCents]: String(priceCents),
  };
  await prisma.$transaction(
    Object.entries(writes).map(([key, value]) => prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } }))
  );
  return plan.id;
}

/**
 * Sync one API key with its PayPal subscription. `expectedKeyId` (from the
 * key owner's own page) must match the subscription's custom_id.
 */
export async function syncApiSubscription(
  subscriptionId: string,
  expectedKeyId?: string
): Promise<{ ok: true; plan: "PRO" | "FREE" } | { ok: false; reason: string }> {
  const sub = await getBillingSubscription(subscriptionId);
  const { proPlanId } = await getApiSettings();
  const existing = await prisma.apiKey.findUnique({ where: { paypalSubscriptionId: subscriptionId } });
  // Ours if it's on the current Pro plan, or already linked to a key (an
  // older Pro price, kept after the plan was re-created).
  if (sub.plan_id !== proPlanId && !existing) return { ok: false, reason: "Unknown plan" };

  const keyId = existing?.id ?? sub.custom_id ?? null;
  if (!keyId) return { ok: false, reason: "No key for this subscription" };
  if (expectedKeyId && keyId !== expectedKeyId) return { ok: false, reason: "Subscription belongs to another key" };
  const key = existing ?? (await prisma.apiKey.findUnique({ where: { id: keyId } }));
  if (!key) return { ok: false, reason: "Unknown key" };

  const next = sub.billing_info?.next_billing_time ? new Date(sub.billing_info.next_billing_time) : null;
  if (sub.status === "APPROVAL_PENDING") return { ok: false, reason: "Not active yet" };
  if (sub.status === "ACTIVE" || sub.status === "APPROVED") {
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { plan: "PRO", paypalSubscriptionId: sub.id, currentPeriodEnd: next ?? key.currentPeriodEnd },
    });
    return { ok: true, plan: "PRO" };
  }
  // CANCELLED keeps Pro until the paid period ends; SUSPENDED/EXPIRED end it now.
  const until = sub.status === "CANCELLED" ? next ?? key.currentPeriodEnd ?? new Date() : new Date();
  await prisma.apiKey.update({ where: { id: key.id }, data: { plan: "PRO", paypalSubscriptionId: sub.id, currentPeriodEnd: until } });
  return { ok: true, plan: until.getTime() > Date.now() ? "PRO" : "FREE" };
}

export async function cancelApiPro(keyId: string): Promise<boolean> {
  const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
  if (!key?.paypalSubscriptionId) return false;
  await cancelBillingSubscription(key.paypalSubscriptionId, "Cancelled by the key owner");
  await syncApiSubscription(key.paypalSubscriptionId, keyId);
  return true;
}

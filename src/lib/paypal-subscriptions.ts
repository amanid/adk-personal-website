/**
 * Research subscriptions billed by PayPal.
 *
 * Plans are created once from TIER_PRICES ("Create PayPal plans" in admin)
 * and their ids stored as a site setting. A subscription is never trusted
 * from the browser: every change — activation, renewal, cancellation — is
 * re-read from PayPal and checked against our own plans before it touches a
 * user's access.
 */
import { prisma } from "./prisma";
import {
  cancelBillingSubscription,
  createBillingPlan,
  createCatalogProduct,
  getBillingSubscription,
  type PayPalSubscription,
} from "./paypal";
import {
  SUBSCRIPTION_CURRENCY,
  TIER_LABELS,
  TIER_PRICES,
  type BillingInterval,
  type TierId,
} from "./subscription-plans";

const PLANS_KEY = "paypal.subscriptionPlans"; // plan ids are public by design
const PRODUCT_KEY = "private.paypal.subscriptionProductId";

export type PlanMap = Record<TierId, Record<BillingInterval, string>>;

export async function getPlanMap(): Promise<PlanMap | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: PLANS_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as PlanMap;
  } catch {
    return null;
  }
}

/** Which tier and interval a PayPal plan id is, if it's one of ours. */
export async function planInfo(planId: string): Promise<{ tier: TierId; interval: BillingInterval } | null> {
  const map = await getPlanMap();
  if (!map) return null;
  for (const tier of Object.keys(map) as TierId[]) {
    for (const interval of Object.keys(map[tier]) as BillingInterval[]) {
      if (map[tier][interval] === planId) return { tier, interval };
    }
  }
  return null;
}

/**
 * Create the PayPal product and the six plans (3 tiers × monthly/yearly) at
 * today's TIER_PRICES. Re-running after a price change creates new plans;
 * existing subscribers stay on the plan they signed up to.
 */
export async function setupPayPalPlans(homeUrl: string): Promise<PlanMap> {
  let productId = (await prisma.siteSetting.findUnique({ where: { key: PRODUCT_KEY } }))?.value;
  if (!productId) {
    productId = (await createCatalogProduct("Research subscription", "Access to research publications and datasets", homeUrl)).id;
    await prisma.siteSetting.upsert({ where: { key: PRODUCT_KEY }, update: { value: productId }, create: { key: PRODUCT_KEY, value: productId } });
  }
  const map = {} as PlanMap;
  for (const tier of Object.keys(TIER_PRICES) as TierId[]) {
    map[tier] = {} as Record<BillingInterval, string>;
    for (const interval of ["MONTH", "YEAR"] as BillingInterval[]) {
      const plan = await createBillingPlan({
        productId,
        name: `${TIER_LABELS[tier]} — ${interval === "MONTH" ? "monthly" : "yearly"}`,
        intervalUnit: interval,
        amountCents: TIER_PRICES[tier][interval],
        currency: SUBSCRIPTION_CURRENCY,
      });
      map[tier][interval] = plan.id;
    }
  }
  const value = JSON.stringify(map);
  await prisma.siteSetting.upsert({ where: { key: PLANS_KEY }, update: { value }, create: { key: PLANS_KEY, value } });
  return map;
}

const STATUS_MAP = {
  ACTIVE: "ACTIVE",
  APPROVED: "ACTIVE", // approved and billing; PayPal flips it to ACTIVE shortly
  SUSPENDED: "PAST_DUE",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  APPROVAL_PENDING: null, // not paid yet: nothing to record
} as const;

/**
 * Bring our Subscription row in line with PayPal's view of `subscriptionId`.
 * `expectedUserId` (from a signed-in activation) must match the subscription's
 * custom_id; webhooks pass none and only update a subscription we can tie to
 * an existing user.
 */
export async function syncPayPalSubscription(
  subscriptionId: string,
  expectedUserId?: string
): Promise<{ ok: true; tier: TierId; status: string } | { ok: false; reason: string }> {
  const sub: PayPalSubscription = await getBillingSubscription(subscriptionId);
  const info = await planInfo(sub.plan_id);
  if (!info) return { ok: false, reason: "Unknown plan" };

  const existing = await prisma.subscription.findUnique({ where: { paypalSubscriptionId: sub.id } });
  const userId = existing?.userId ?? sub.custom_id ?? null;
  if (!userId) return { ok: false, reason: "No user for this subscription" };
  if (expectedUserId && userId !== expectedUserId) return { ok: false, reason: "Subscription belongs to another account" };
  if (!(await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }))) {
    return { ok: false, reason: "Unknown user" };
  }

  const mapped = STATUS_MAP[sub.status];
  if (!mapped) return { ok: false, reason: `Not active yet (${sub.status})` };

  const next = sub.billing_info?.next_billing_time ? new Date(sub.billing_info.next_billing_time) : null;
  // Cancelled by the subscriber: access runs to the end of the paid period,
  // which is the next billing time PayPal had scheduled (or what we stored).
  const periodEnd = next ?? existing?.currentPeriodEnd ?? null;
  const data = {
    tier: info.tier,
    status: mapped,
    paypalSubscriptionId: sub.id,
    paypalPlanId: sub.plan_id,
    billingInterval: info.interval,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: mapped === "CANCELLED",
  } as const;
  await prisma.subscription.upsert({ where: { userId }, update: data, create: { userId, ...data } });
  return { ok: true, tier: info.tier, status: mapped };
}

/** Cancel the signed-in user's PayPal subscription; access lasts to period end. */
export async function cancelUserPayPalSubscription(userId: string): Promise<boolean> {
  const s = await prisma.subscription.findUnique({ where: { userId } });
  if (!s?.paypalSubscriptionId || s.status !== "ACTIVE") return false;
  await cancelBillingSubscription(s.paypalSubscriptionId, "Cancelled by the subscriber on the website");
  await syncPayPalSubscription(s.paypalSubscriptionId, userId);
  return true;
}

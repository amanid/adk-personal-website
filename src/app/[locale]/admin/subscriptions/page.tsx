"use client";

import { useCallback, useEffect, useState } from "react";
import { Repeat, Zap } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Sub {
  id: string;
  tier: string;
  status: string;
  billingInterval: string | null;
  paypalSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
  user: { email: string; name: string | null };
}

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<{
    plans: Record<string, Record<string, string>> | null;
    prices: Record<string, Record<string, number>>;
    paypalConfigured: boolean;
    paypalEnv: string;
    subscriptions: Sub[];
  } | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/subscriptions");
    const d = await res.json().catch(() => null);
    if (res.ok) setData(d);
    else setFlash({ ok: false, text: d?.error || "Could not load" });
  }, []);
  useEffect(() => {
    // Initial fetch on mount; state is only set after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const setup = async () => {
    const msg = data?.plans
      ? "Create NEW PayPal plans at the current prices? Existing subscribers keep their plan; new subscribers get the new prices."
      : `Create the PayPal product and 6 plans in your ${data?.paypalEnv} PayPal account?`;
    if (!confirm(msg)) return;
    setBusy(true);
    setFlash(null);
    const res = await fetch("/api/admin/subscriptions", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setFlash({ ok: res.ok, text: d.message || d.error || "Done" });
    setBusy(false);
    load();
  };

  if (!data) return <p className="text-text-secondary">Loading…</p>;
  const active = data.subscriptions.filter((s) => s.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Repeat className="w-6 h-6 text-gold" /> Subscriptions
      </h1>

      {flash && (
        <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{flash.text}</p>
      )}

      <div className="glass p-5 space-y-3">
        <p className="font-medium">Automatic billing with PayPal ({data.paypalEnv})</p>
        {!data.paypalConfigured ? (
          <p className="text-sm text-amber-400">PayPal REST credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) aren&apos;t set on the server.</p>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              {data.plans
                ? "Plans are set up: signed-in visitors can subscribe with PayPal on the Subscribe page."
                : "Not set up yet: the Subscribe page only offers the manual request form."}{" "}
              For renewals and cancellations to sync, subscribe your PayPal webhook to the BILLING.SUBSCRIPTION.* events and PAYMENT.SALE.COMPLETED.
            </p>
            <table className="text-sm">
              <tbody>
                {Object.entries(data.prices).map(([tier, p]) => (
                  <tr key={tier}>
                    <td className="pr-6 py-1 text-text-secondary">{tier.replace("_", " ").toLowerCase()}</td>
                    <td className="pr-6 figure">{formatPrice(p.MONTH, "USD")} / month</td>
                    <td className="figure">{formatPrice(p.YEAR, "USD")} / year</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button disabled={busy} onClick={setup} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm disabled:opacity-50">
              <Zap className="w-4 h-4" /> {data.plans ? "Recreate plans at these prices" : "Create PayPal plans"}
            </button>
          </>
        )}
      </div>

      <p className="text-sm text-text-secondary">{active.length} active subscription(s).</p>
      {data.subscriptions.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-text-secondary">No subscriptions yet.</div>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-glass-border">
                <th className="p-3 font-medium">Subscriber</th>
                <th className="p-3 font-medium">Tier</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Billing</th>
                <th className="p-3 font-medium">Period end</th>
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.map((s) => (
                <tr key={s.id} className="border-b border-glass-border/60">
                  <td className="p-3">{s.user.name || "—"} <span className="text-text-muted">{s.user.email}</span></td>
                  <td className="p-3">{s.tier.replace("_", " ").toLowerCase()}</td>
                  <td className="p-3">{s.status.toLowerCase()}{s.cancelAtPeriodEnd ? " (ends)" : ""}</td>
                  <td className="p-3 text-text-secondary">{s.paypalSubscriptionId ? `PayPal · ${s.billingInterval?.toLowerCase()}` : "manual"}</td>
                  <td className="p-3 text-text-secondary">{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

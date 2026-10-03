"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Save } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const INPUT = "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-md text-text-primary focus:border-gold/50 focus:outline-none text-sm";

interface KeyRow {
  id: string;
  name: string;
  email: string;
  useCase: string | null;
  keyPrefix: string;
  status: string;
  plan: "FREE" | "PRO";
  paid: boolean;
  currentPeriodEnd: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  usedThisMonth: number;
}
interface Data {
  settings: { freeQuota: number; proQuota: number; proPriceCents: number | null; proPlanId: string | null };
  period: string;
  paypalConfigured: boolean;
  keys: KeyRow[];
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function AdminDataApiPage() {
  const [d, setD] = useState<Data | null>(null);
  const [quotas, setQuotas] = useState({ freeQuota: 1000, proQuota: 50000 });
  const [price, setPrice] = useState("");
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r: Data = await send("/api/admin/data-api", "GET");
      setD(r);
      setQuotas({ freeQuota: r.settings.freeQuota, proQuota: r.settings.proQuota });
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  }, []);
  useEffect(() => {
    // Initial fetch on mount; state is only set after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const act = async (fn: () => Promise<{ message?: string }>, ok: string) => {
    setFlash(null);
    try {
      const r = await fn();
      setFlash({ ok: true, text: r?.message || ok });
      load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  };

  if (!d) return <p className="text-text-secondary">Loading…</p>;
  const totalCalls = d.keys.reduce((s, k) => s + k.usedThisMonth, 0);
  const keyAction = (id: string, body: object, ok: string) => act(() => send(`/api/admin/data-api/keys/${id}`, "PATCH", body), ok);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <KeyRound className="w-6 h-6 text-gold" /> Data API
      </h1>
      <p className="text-sm text-text-secondary">
        {d.keys.filter((k) => k.status === "ACTIVE").length} active key(s) · {d.keys.filter((k) => k.plan === "PRO").length} Pro ·{" "}
        {totalCalls.toLocaleString()} requests in {d.period}. Public portal:{" "}
        <a href="/en/developers" target="_blank" className="text-gold">/developers</a>
      </p>
      {flash && <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{flash.text}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass p-5 space-y-3">
          <p className="font-medium">Monthly quotas</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-text-secondary">
              Free
              <input type="number" min={1} className={INPUT} value={quotas.freeQuota} onChange={(e) => setQuotas({ ...quotas, freeQuota: Number(e.target.value) })} />
            </label>
            <label className="text-xs text-text-secondary">
              Pro
              <input type="number" min={1} className={INPUT} value={quotas.proQuota} onChange={(e) => setQuotas({ ...quotas, proQuota: Number(e.target.value) })} />
            </label>
          </div>
          <button onClick={() => act(() => send("/api/admin/data-api", "PUT", quotas), "Saved.")} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
        <div className="glass p-5 space-y-3">
          <p className="font-medium">Pro plan</p>
          <p className="text-sm text-text-secondary">
            {d.settings.proPriceCents && d.settings.proPlanId
              ? `Live at ${formatPrice(d.settings.proPriceCents, "USD")} / month.`
              : "Not offered yet — set a price to create the PayPal plan."}
          </p>
          {d.paypalConfigured ? (
            <div className="flex gap-2 items-end">
              <label className="text-xs text-text-secondary flex-1">
                Monthly price (USD)
                <input type="number" min={1} step="0.01" className={INPUT} value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <button
                disabled={!price}
                onClick={() => {
                  if (confirm(`Create a PayPal plan at $${price}/month? New Pro subscribers pay this; existing ones keep their price.`))
                    act(() => send("/api/admin/data-api", "POST", { priceCents: Math.round(Number(price) * 100) }), "Created.");
                }}
                className="px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm disabled:opacity-40"
              >
                {d.settings.proPlanId ? "Set new price" : "Create plan"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-amber-400">PayPal REST credentials aren&apos;t set on the server.</p>
          )}
        </div>
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted border-b border-glass-border">
              <th className="p-3 font-medium">Owner</th>
              <th className="p-3 font-medium">Key</th>
              <th className="p-3 font-medium">Plan</th>
              <th className="p-3 font-medium text-right">This month</th>
              <th className="p-3 font-medium">Last used</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {d.keys.map((k) => (
              <tr key={k.id} className="border-b border-glass-border/60 align-top">
                <td className="p-3">
                  {k.name}
                  <div className="text-xs text-text-muted">{k.email}</div>
                  {k.useCase && <div className="text-xs text-text-secondary mt-1 max-w-xs">{k.useCase}</div>}
                </td>
                <td className="p-3 figure">
                  {k.keyPrefix}… {k.status === "REVOKED" && <span className="text-red-400 text-xs">revoked</span>}
                </td>
                <td className="p-3">
                  {k.plan.toLowerCase()}
                  {k.paid ? " (PayPal)" : ""}
                  {k.plan === "PRO" && k.currentPeriodEnd ? <div className="text-xs text-text-muted">until {new Date(k.currentPeriodEnd).toLocaleDateString()}</div> : null}
                </td>
                <td className="p-3 figure text-right">{k.usedThisMonth.toLocaleString()}</td>
                <td className="p-3 text-text-muted">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "never"}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {k.status === "ACTIVE" && (
                    <>
                      {k.plan === "FREE" ? (
                        <button onClick={() => keyAction(k.id, { action: "grant_pro" }, "Pro granted.")} className="text-xs text-gold mr-3">Grant Pro</button>
                      ) : !k.paid ? (
                        <button onClick={() => keyAction(k.id, { action: "set_free" }, "Back to Free.")} className="text-xs text-text-secondary mr-3">Set Free</button>
                      ) : null}
                      <button onClick={() => confirm("Revoke this key?") && keyAction(k.id, { action: "revoke" }, "Revoked.")} className="text-xs text-red-400">Revoke</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

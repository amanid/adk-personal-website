"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Handshake, Check, X, Save } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const INPUT =
  "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-md text-text-primary focus:border-gold/50 focus:outline-none text-sm";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
  commissionPercent: number;
  website: string | null;
  pitch: string | null;
  payoutMethod: string | null;
  payoutDetails: string | null;
  createdAt: string;
  clicks30: number;
  paidSales: number;
}
interface Commission {
  id: string;
  amountCents: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "PAID" | "VOID";
  holdUntil: string;
  createdAt: string;
  payoutNote: string | null;
  affiliate: { name: string; payoutMethod: string | null; payoutDetails: string | null };
  order: { orderNumber: string; totalCents: number };
}
interface Settings {
  defaultPercent: number;
  cookieDays: number;
  holdDays: number;
}

const CHIP: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400",
  APPROVED: "bg-green-500/15 text-green-400",
  PAID: "bg-signal/15 text-signal",
  SUSPENDED: "bg-red-500/15 text-red-400",
  REJECTED: "bg-navy-light text-text-muted",
  VOID: "bg-navy-light text-text-muted",
};

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function AdminAffiliatesPage() {
  const [tab, setTab] = useState<"affiliates" | "commissions" | "settings">("affiliates");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await send("/api/admin/affiliates", "GET");
      setAffiliates(d.affiliates);
      setCommissions(d.commissions);
      setSettings(d.settings);
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  }, []);
  useEffect(() => {
    // Initial fetch on mount; state is only set after the await.
     
    load();
  }, [load]);

  const act = async (fn: () => Promise<{ message?: string; warning?: string }>) => {
    setFlash(null);
    try {
      const r = await fn();
      setFlash({ ok: !r.warning, text: r.warning || r.message || "Saved." });
      setSelected(new Set());
      await load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  };

  // Owed = approved but not yet paid, per affiliate and currency.
  const owed = useMemo(() => {
    const m = new Map<string, { name: string; method: string; details: string; byCur: Map<string, number> }>();
    for (const c of commissions) {
      if (c.status !== "APPROVED") continue;
      const k = c.affiliate.name;
      const row = m.get(k) ?? { name: k, method: c.affiliate.payoutMethod || "", details: c.affiliate.payoutDetails || "", byCur: new Map() };
      row.byCur.set(c.currency, (row.byCur.get(c.currency) ?? 0) + c.amountCents);
      m.set(k, row);
    }
    return [...m.values()];
  }, [commissions]);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const pendingApplications = affiliates.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Handshake className="w-6 h-6 text-gold" /> Affiliates
      </h1>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["affiliates", `Affiliates${pendingApplications ? ` (${pendingApplications} to review)` : ""}`],
            ["commissions", "Commissions"],
            ["settings", "Program settings"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-md text-sm border ${tab === id ? "border-gold bg-gold/10" : "border-glass-border text-text-secondary"}`}>
            {label}
          </button>
        ))}
      </div>

      {flash && (
        <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{flash.text}</p>
      )}

      {tab === "affiliates" &&
        (affiliates.length === 0 ? (
          <div className="glass p-10 text-center text-sm text-text-secondary">
            No applications yet. Share the program page: <span className="figure">/affiliates</span>
          </div>
        ) : (
          affiliates.map((a) => (
            <div key={a.id} className="glass p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {a.name} <span className="text-sm text-text-secondary">· {a.email}</span>
                  </p>
                  <p className="text-xs text-text-muted">
                    /r/{a.code} · {a.clicks30} clicks (30d) · {a.paidSales} paid sales · payout {a.payoutMethod}: {a.payoutDetails}
                  </p>
                  {a.website && <p className="text-xs text-text-secondary">{a.website}</p>}
                  {a.pitch && <p className="text-sm text-text-secondary mt-1 whitespace-pre-line">{a.pitch}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${CHIP[a.status]}`}>{a.status.toLowerCase()}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {a.status !== "APPROVED" && (
                  <button onClick={() => act(() => send(`/api/admin/affiliates/${a.id}`, "PATCH", { status: "APPROVED" }))} className="px-3 py-1.5 rounded-md bg-gold text-charcoal font-semibold inline-flex items-center gap-1">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                )}
                {a.status === "PENDING" && (
                  <button onClick={() => act(() => send(`/api/admin/affiliates/${a.id}`, "PATCH", { status: "REJECTED" }))} className="px-3 py-1.5 rounded-md border border-glass-border inline-flex items-center gap-1">
                    <X className="w-4 h-4" /> Reject
                  </button>
                )}
                {a.status === "APPROVED" && (
                  <button onClick={() => act(() => send(`/api/admin/affiliates/${a.id}`, "PATCH", { status: "SUSPENDED" }))} className="px-3 py-1.5 rounded-md border border-glass-border text-red-400">
                    Suspend
                  </button>
                )}
                <label className="inline-flex items-center gap-2 ml-auto text-text-secondary">
                  Rate %
                  <input
                    type="number"
                    min={1}
                    max={90}
                    defaultValue={a.commissionPercent}
                    className="w-20 px-2 py-1 bg-navy/50 border border-glass-border rounded-md text-sm"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== a.commissionPercent) act(() => send(`/api/admin/affiliates/${a.id}`, "PATCH", { commissionPercent: v }));
                    }}
                  />
                </label>
              </div>
            </div>
          ))
        ))}

      {tab === "commissions" && (
        <div className="space-y-4">
          {owed.length > 0 && (
            <div className="glass p-4">
              <p className="text-sm font-medium mb-2">To pay out (approved)</p>
              <ul className="text-sm text-text-secondary space-y-1">
                {owed.map((o) => (
                  <li key={o.name}>
                    {o.name}: <span className="figure text-text-primary">{[...o.byCur.entries()].map(([c, v]) => formatPrice(v, c)).join(" + ")}</span> via {o.method} {o.details}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <button disabled={!selected.size} onClick={() => act(() => send("/api/admin/affiliates/commissions", "POST", { action: "approve", ids: [...selected] }))} className="px-3 py-1.5 rounded-md border border-glass-border text-sm disabled:opacity-40">
              Approve selected
            </button>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Payout reference (optional)" className={`${INPUT} w-56`} />
            <button disabled={!selected.size} onClick={() => act(() => send("/api/admin/affiliates/commissions", "POST", { action: "pay", ids: [...selected], note }))} className="px-3 py-1.5 rounded-md bg-gold text-charcoal font-semibold text-sm disabled:opacity-40">
              Mark selected paid
            </button>
            <button
              disabled={!selected.size}
              onClick={() => {
                if (confirm("Void the selected commissions?")) act(() => send("/api/admin/affiliates/commissions", "POST", { action: "void", ids: [...selected] }));
              }}
              className="px-3 py-1.5 rounded-md border border-glass-border text-sm text-red-400 disabled:opacity-40"
            >
              Void selected
            </button>
          </div>
          {commissions.length === 0 ? (
            <div className="glass p-8 text-center text-sm text-text-secondary">No commissions yet.</div>
          ) : (
            <div className="glass overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-glass-border">
                    <th className="p-3" />
                    <th className="p-3 font-medium">Affiliate</th>
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium text-right">Commission</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Approvable</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-glass-border/60">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="accent-gold"
                          disabled={c.status === "PAID" || c.status === "VOID"}
                          checked={selected.has(c.id)}
                          onChange={(e) => {
                            const s = new Set(selected);
                            if (e.target.checked) s.add(c.id);
                            else s.delete(c.id);
                            setSelected(s);
                          }}
                          aria-label={`Select ${c.order.orderNumber}`}
                        />
                      </td>
                      <td className="p-3">{c.affiliate.name}</td>
                      <td className="p-3 figure text-text-secondary">
                        {c.order.orderNumber} · {formatPrice(c.order.totalCents, c.currency)}
                      </td>
                      <td className="p-3 figure text-right">{formatPrice(c.amountCents, c.currency)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CHIP[c.status]}`}>{c.status.toLowerCase()}</span>
                        {c.payoutNote && <span className="text-xs text-text-muted ml-2">{c.payoutNote}</span>}
                      </td>
                      <td className="p-3 text-xs text-text-muted">
                        {c.status === "PENDING" ? (new Date(c.holdUntil).getTime() <= now ? "now" : new Date(c.holdUntil).toLocaleDateString()) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "settings" && settings && (
        <div className="glass p-5 grid sm:grid-cols-3 gap-4 items-end">
          <label className="text-xs text-text-secondary">
            Default commission % (new affiliates)
            <input type="number" min={1} max={90} className={INPUT} value={settings.defaultPercent} onChange={(e) => setSettings({ ...settings, defaultPercent: Number(e.target.value) })} />
          </label>
          <label className="text-xs text-text-secondary">
            Referral cookie (days)
            <input type="number" min={1} max={365} className={INPUT} value={settings.cookieDays} onChange={(e) => setSettings({ ...settings, cookieDays: Number(e.target.value) })} />
          </label>
          <label className="text-xs text-text-secondary">
            Refund hold before approval (days)
            <input type="number" min={0} max={120} className={INPUT} value={settings.holdDays} onChange={(e) => setSettings({ ...settings, holdDays: Number(e.target.value) })} />
          </label>
          <button onClick={() => act(() => send("/api/admin/affiliates/settings", "PUT", settings))} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm w-fit">
            <Save className="w-4 h-4" /> Save settings
          </button>
        </div>
      )}
    </div>
  );
}

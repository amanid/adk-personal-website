"use client";

import { useCallback, useEffect, useState } from "react";
import { Webhook, Plus, Send, Trash2, Eye, RotateCw } from "lucide-react";

const INPUT =
  "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-md text-text-primary focus:border-gold/50 focus:outline-none text-sm";

interface Endpoint {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  active: boolean;
}
interface Delivery {
  id: string;
  endpointId: string;
  event: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  attempts: number;
  lastStatusCode: number | null;
  lastError: string | null;
  nextAttemptAt: string;
  createdAt: string;
}

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

const CHIP: Record<string, string> = {
  SUCCESS: "text-green-400",
  PENDING: "text-amber-400",
  FAILED: "text-red-400",
};

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [catalogue, setCatalogue] = useState<Record<string, string>>({});
  const [form, setForm] = useState<{ url: string; description: string; events: string[] } | null>(null);
  const [secret, setSecret] = useState<{ endpointId: string; value: string } | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await send("/api/admin/webhooks", "GET");
      setEndpoints(d.endpoints);
      setDeliveries(d.deliveries);
      setCatalogue(d.events);
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  }, []);
  useEffect(() => {
    // Initial fetch on mount; state is only set after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setFlash(null);
    try {
      await fn();
      setFlash({ ok: true, text: ok });
      await load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Webhook className="w-6 h-6 text-gold" /> Webhooks
        </h1>
        {!form && (
          <button onClick={() => setForm({ url: "", description: "", events: [] })} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">
            <Plus className="w-4 h-4" /> Add endpoint
          </button>
        )}
      </div>
      <p className="text-sm text-text-secondary max-w-3xl">
        Send events to your other systems (Zapier, Make, n8n, a CRM, your own server). Each request is signed using the open
        Standard Webhooks format (<code className="figure">webhook-id</code>, <code className="figure">webhook-timestamp</code>,{" "}
        <code className="figure">webhook-signature</code>), so the receiver can verify it came from this site. Failed deliveries
        retry with backoff for about a day via the scheduled tick.
      </p>

      {flash && <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{flash.text}</p>}

      {secret && (
        <div className="glass-strong p-4 space-y-2">
          <p className="text-sm font-medium">Signing secret — store it in the receiving system:</p>
          <input readOnly value={secret.value} onFocus={(e) => e.target.select()} className={`${INPUT} figure`} />
          <button onClick={() => setSecret(null)} className="text-xs text-text-secondary">Hide</button>
        </div>
      )}

      {form && (
        <div className="glass-strong p-5 space-y-3">
          <label className="block text-xs text-text-secondary">
            Endpoint URL (https)
            <input className={INPUT} value={form.url} placeholder="https://hooks.zapier.com/…" onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </label>
          <label className="block text-xs text-text-secondary">
            Description
            <input className={INPUT} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div>
            <p className="text-xs text-text-secondary mb-1">Events (none ticked = all)</p>
            <div className="grid sm:grid-cols-2 gap-1">
              {Object.entries(catalogue).map(([ev, desc]) => (
                <label key={ev} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-gold mt-1"
                    checked={form.events.includes(ev)}
                    onChange={(e) => setForm({ ...form, events: e.target.checked ? [...form.events, ev] : form.events.filter((x) => x !== ev) })}
                  />
                  <span>
                    <span className="figure">{ev}</span> <span className="text-text-muted text-xs">— {desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                act(async () => {
                  const r = await send("/api/admin/webhooks", "POST", form);
                  setSecret({ endpointId: r.endpoint.id, value: r.secret });
                  setForm(null);
                }, "Endpoint added. Copy the signing secret now.")
              }
              className="px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm"
            >
              Save
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 rounded-md border border-glass-border text-sm">Cancel</button>
          </div>
        </div>
      )}

      {endpoints.map((e) => (
        <div key={e.id} className="glass p-4 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium figure truncate">{e.url}</p>
              <p className="text-xs text-text-muted">
                {e.description ? `${e.description} · ` : ""}
                {e.events.length ? e.events.join(", ") : "all events"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-gold" checked={e.active} onChange={(ev) => act(() => send(`/api/admin/webhooks/${e.id}`, "PATCH", { active: ev.target.checked }), ev.target.checked ? "Enabled." : "Paused.")} />
              Active
            </label>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              onClick={async () => {
                setFlash(null);
                try {
                  const r = await send(`/api/admin/webhooks/${e.id}/test`, "POST");
                  setFlash({ ok: r.ok, text: r.ok ? `Ping delivered (HTTP ${r.statusCode}).` : `Ping failed: ${r.error}` });
                  load();
                } catch (err) {
                  setFlash({ ok: false, text: (err as Error).message });
                }
              }}
              className="px-3 py-1.5 rounded-md border border-glass-border inline-flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Send test
            </button>
            <button onClick={async () => setSecret({ endpointId: e.id, value: (await send(`/api/admin/webhooks/${e.id}/secret`, "GET")).secret })} className="px-3 py-1.5 rounded-md border border-glass-border inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Reveal secret
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this endpoint and its delivery log?")) act(() => send(`/api/admin/webhooks/${e.id}`, "DELETE"), "Deleted.");
              }}
              className="px-3 py-1.5 rounded-md border border-glass-border text-red-400"
              aria-label="Delete endpoint"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      <div className="glass p-4">
        <p className="font-medium mb-3">Recent deliveries</p>
        {deliveries.length === 0 ? (
          <p className="text-sm text-text-secondary">None yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-b border-glass-border/60">
                  <td className="py-1.5 text-text-muted">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="py-1.5 figure">{d.event}</td>
                  <td className={`py-1.5 ${CHIP[d.status]}`}>{d.status.toLowerCase()}</td>
                  <td className="py-1.5 text-text-secondary">
                    {d.attempts} attempt(s){d.lastStatusCode ? ` · HTTP ${d.lastStatusCode}` : ""}
                    {d.lastError ? ` · ${d.lastError}` : ""}
                  </td>
                  <td className="py-1.5 text-right">
                    {d.status !== "SUCCESS" && (
                      <button onClick={() => act(() => send(`/api/admin/webhooks/deliveries/${d.id}/retry`, "POST"), "Retried.")} className="text-xs inline-flex items-center gap-1 text-gold">
                        <RotateCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

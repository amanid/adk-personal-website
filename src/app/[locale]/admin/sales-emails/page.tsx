"use client";

import { useCallback, useEffect, useState } from "react";
import { MailCheck, Play, Save } from "lucide-react";

const INPUT =
  "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-md text-text-primary focus:border-gold/50 focus:outline-none text-sm";

interface Settings {
  remindersEnabled: boolean;
  reminderHours: number;
  followUpsEnabled: boolean;
  followUpDays: number;
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

export default function SalesEmailsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [lastRun, setLastRun] = useState<{ at: string; reminders: number; followUps: number } | null>(null);
  const [optOuts, setOptOuts] = useState(0);
  const [cronConfigured, setCronConfigured] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await send("/api/admin/sales-emails", "GET");
      setSettings(d.settings);
      setLastRun(d.lastRun);
      setOptOuts(d.optOuts);
      setCronConfigured(d.cronConfigured);
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  }, []);
  useEffect(() => {
    // Initial fetch on mount; state is only set after the await.
     
    load();
  }, [load]);

  const act = async (fn: () => Promise<{ message?: string }>) => {
    setBusy(true);
    setFlash(null);
    try {
      const r = await fn();
      setFlash({ ok: true, text: r.message || "Done." });
      await load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <p className="text-text-secondary">Loading…</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <MailCheck className="w-6 h-6 text-gold" /> Sales emails
      </h1>
      <p className="text-sm text-text-secondary">
        Automatic emails to store buyers. Each order gets at most one of each, only orders inside a short recent window are
        considered (so past customers are never swept up), and every email has a one-click opt-out ({optOuts} so far). To
        announce a new product to newsletter subscribers, use the megaphone button in Bookstore.
      </p>

      {flash && (
        <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{flash.text}</p>
      )}

      <div className="glass p-5 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-gold" checked={settings.remindersEnabled} onChange={(e) => setSettings({ ...settings, remindersEnabled: e.target.checked })} />
          Remind buyers whose order is still unpaid
        </label>
        <label className="block text-xs text-text-secondary max-w-xs">
          …after this many hours (reminders go out up to 48 h later than this)
          <input type="number" min={1} max={168} className={INPUT} value={settings.reminderHours} onChange={(e) => setSettings({ ...settings, reminderHours: Number(e.target.value) })} />
        </label>
        <label className="flex items-center gap-2 text-sm pt-2">
          <input type="checkbox" className="accent-gold" checked={settings.followUpsEnabled} onChange={(e) => setSettings({ ...settings, followUpsEnabled: e.target.checked })} />
          Send a &ldquo;you might also like&rdquo; email after a purchase
        </label>
        <label className="block text-xs text-text-secondary max-w-xs">
          …this many days after payment (up to 3 days later than this)
          <input type="number" min={1} max={60} className={INPUT} value={settings.followUpDays} onChange={(e) => setSettings({ ...settings, followUpDays: Number(e.target.value) })} />
        </label>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => act(() => send("/api/admin/sales-emails", "PUT", settings))} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm disabled:opacity-50">
            <Save className="w-4 h-4" /> Save
          </button>
          <button disabled={busy} onClick={() => act(() => send("/api/admin/sales-emails", "POST"))} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-glass-border text-sm disabled:opacity-50">
            <Play className="w-4 h-4" /> Run now
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Last run: {lastRun ? `${new Date(lastRun.at).toLocaleString()} — ${lastRun.reminders} reminder(s), ${lastRun.followUps} follow-up(s)` : "never"}
        </p>
      </div>

      <div className="glass p-5 text-sm space-y-2">
        <p className="font-medium">Schedule {cronConfigured ? <span className="text-green-400">(ready)</span> : <span className="text-amber-400">(not set up)</span>}</p>
        <p className="text-text-secondary">
          To run hourly without you, set a <code className="figure">CRON_SECRET</code> environment variable (at least 16 random
          characters) on Render, then have any scheduler call:
        </p>
        <pre className="figure text-xs bg-navy/60 rounded-md p-3 overflow-x-auto">{`GET https://www.konanamanidieudonne.org/api/cron/tick
Authorization: Bearer <CRON_SECRET>`}</pre>
        <p className="text-text-muted text-xs">Until then, use &ldquo;Run now&rdquo;.</p>
      </div>
    </div>
  );
}

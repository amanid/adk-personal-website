"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  Mail,
  Plug,
  Save,
  Send,
  Server,
  ShieldCheck,
} from "lucide-react";

interface EmailConfigPublic {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  replyTo: string;
  hasPassword: boolean;
  configured: boolean;
  source: "database" | "environment" | "none";
}

interface RecentFailure {
  orderNumber: string;
  email: string;
  createdAt: string;
  lastEmailError: string;
}

type Feedback = { kind: "success" | "error"; message: string } | null;

const emptyConfig: EmailConfigPublic = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  from: "",
  replyTo: "",
  hasPassword: false,
  configured: false,
  source: "none",
};

/** Common providers, so the host/port pair doesn't have to be looked up. */
const PRESETS = [
  { label: "Gmail / Workspace", host: "smtp.gmail.com", port: 587, secure: false },
  { label: "Outlook / Microsoft 365", host: "smtp.office365.com", port: 587, secure: false },
  { label: "SendGrid", host: "smtp.sendgrid.net", port: 587, secure: false },
  { label: "Brevo", host: "smtp-relay.brevo.com", port: 587, secure: false },
  { label: "Mailgun", host: "smtp.mailgun.org", port: 587, secure: false },
  { label: "Zoho", host: "smtp.zoho.com", port: 465, secure: true },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 focus:ring-1 focus:ring-gold/30 outline-none text-sm transition-colors";

export default function AdminEmailPage() {
  const [config, setConfig] = useState<EmailConfigPublic>(emptyConfig);
  const [password, setPassword] = useState("");
  const [testTo, setTestTo] = useState("");
  const [failures, setFailures] = useState<RecentFailure[]>([]);
  const [failedCount, setFailedCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email");
      if (!res.ok) throw new Error("Failed to load email settings");
      const data = await res.json();
      setConfig({ ...emptyConfig, ...data.config });
      setFailures(data.recentFailures || []);
      setFailedCount(data.failedCount || 0);
    } catch {
      setFeedback({ kind: "error", message: "Could not load email settings." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof EmailConfigPublic>(key: K, value: EmailConfigPublic[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const applyPreset = (preset: (typeof PRESETS)[number]) =>
    setConfig((c) => ({ ...c, host: preset.host, port: preset.port, secure: preset.secure }));

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user,
          // Blank keeps whatever is already stored.
          password: password || undefined,
          from: config.from,
          replyTo: config.replyTo,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Save failed");
      setConfig({ ...emptyConfig, ...data.config });
      setPassword("");
      setFeedback({ kind: "success", message: "Email settings saved." });
    } catch (err) {
      setFeedback({ kind: "error", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const runTest = async (mode: "verify" | "send") => {
    const busy = mode === "verify" ? setVerifying : setSending;
    busy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, to: mode === "send" ? testTo : undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Test failed");
      setFeedback({ kind: "success", message: data.message });
    } catch (err) {
      setFeedback({ kind: "error", message: (err as Error).message });
    } finally {
      busy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-secondary">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading email settings…
      </div>
    );
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2 font-[family-name:var(--font-display)]">
          <Mail className="w-6 h-6 text-gold" />
          Email
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Order confirmations, invoices, receipts with download links, and subscriber
          notifications are all sent through this SMTP account.
        </p>
      </header>

      {/* Status */}
      <div
        className={`glass rounded-xl p-4 flex items-start gap-3 border ${
          config.configured ? "border-green-500/30" : "border-amber-500/30"
        }`}
      >
        {config.configured ? (
          <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        )}
        <div className="text-sm">
          <p className="font-medium">
            {config.configured ? "Email is configured" : "Email is not configured"}
          </p>
          <p className="text-text-secondary mt-0.5">
            {config.configured ? (
              <>
                Sending as <span className="text-text-primary">{config.from}</span> via{" "}
                <span className="text-text-primary">
                  {config.host}:{config.port}
                </span>
                .{" "}
                <span className="inline-flex items-center gap-1">
                  {config.source === "database" ? (
                    <>
                      <Database className="w-3 h-3" /> Saved here
                    </>
                  ) : (
                    <>
                      <Server className="w-3 h-3" /> From environment variables
                    </>
                  )}
                </span>
              </>
            ) : (
              "Buyers will not receive receipts or download links until you complete the settings below."
            )}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-xl p-4 text-sm border ${
            feedback.kind === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Settings form */}
      <section className="glass rounded-xl p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <Server className="w-4 h-4 text-gold" />
          SMTP server
        </h2>

        <div>
          <span className="block text-xs text-text-secondary mb-2">Quick presets</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg text-xs border border-glass-border text-text-secondary hover:border-gold/50 hover:text-gold transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="host" className="block text-sm text-text-secondary mb-1">
              Host <span className="text-gold">*</span>
            </label>
            <input
              id="host"
              value={config.host}
              onChange={(e) => update("host", e.target.value)}
              placeholder="smtp.gmail.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="port" className="block text-sm text-text-secondary mb-1">
              Port <span className="text-gold">*</span>
            </label>
            <input
              id="port"
              type="number"
              value={config.port}
              onChange={(e) => update("port", Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.secure}
            onChange={(e) => update("secure", e.target.checked)}
            className="mt-1 accent-gold w-4 h-4"
          />
          <span className="text-sm">
            Implicit SSL/TLS
            <span className="block text-xs text-text-secondary">
              Enable for port 465. Leave off for port 587, which upgrades via STARTTLS.
            </span>
          </span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="user" className="block text-sm text-text-secondary mb-1">
              Username <span className="text-gold">*</span>
            </label>
            <input
              id="user"
              value={config.user}
              onChange={(e) => update("user", e.target.value)}
              placeholder="you@example.com"
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-text-secondary mb-1">
              Password {config.hasPassword && <span className="text-green-400">· saved</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={config.hasPassword ? "•••••••• (unchanged)" : "App password"}
              autoComplete="new-password"
              className={inputClass}
            />
            <p className="text-xs text-text-muted mt-1">
              Stored encrypted. Gmail and Microsoft 365 require an app password, not your
              account password.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="from" className="block text-sm text-text-secondary mb-1">
              From address <span className="text-gold">*</span>
            </label>
            <input
              id="from"
              value={config.from}
              onChange={(e) => update("from", e.target.value)}
              placeholder="KONAN Amani Dieudonné <noreply@konanamanidieudonne.org>"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="replyTo" className="block text-sm text-text-secondary mb-1">
              Reply-to <span className="text-text-muted">(optional)</span>
            </label>
            <input
              id="replyTo"
              value={config.replyTo}
              onChange={(e) => update("replyTo", e.target.value)}
              placeholder="contact@konanamanidieudonne.org"
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save settings"}
        </button>
      </section>

      {/* Test */}
      <section className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold" />
          Test
        </h2>
        <p className="text-sm text-text-secondary">
          Check the connection first — that isolates wrong credentials from delivery problems.
          Then send yourself a real message.
        </p>

        <div className="flex flex-wrap gap-3 items-end">
          <button
            type="button"
            onClick={() => runTest("verify")}
            disabled={verifying}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold/50 text-gold font-medium hover:bg-gold/10 transition-all disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            {verifying ? "Connecting…" : "Test connection"}
          </button>

          <div className="flex-1 min-w-[220px]">
            <label htmlFor="testTo" className="block text-sm text-text-secondary mb-1">
              Send a test email to
            </label>
            <input
              id="testTo"
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <button
            type="button"
            onClick={() => runTest("send")}
            disabled={sending || !emailValid}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send test"}
          </button>
        </div>
      </section>

      {/* Delivery failures */}
      {failedCount > 0 && (
        <section className="glass rounded-xl p-6 space-y-3 border border-red-500/20">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Recent delivery failures
            <span className="text-xs font-normal text-text-secondary">
              ({failedCount} order{failedCount === 1 ? "" : "s"})
            </span>
          </h2>
          <ul className="space-y-2">
            {failures.map((f) => (
              <li key={f.orderNumber} className="text-sm border-b border-glass-border pb-2 last:border-0">
                <div className="flex justify-between gap-3 flex-wrap">
                  <span className="font-medium">{f.orderNumber}</span>
                  <span className="text-text-secondary">{f.email}</span>
                </div>
                <p className="text-xs text-red-400 mt-1 break-words">{f.lastEmailError}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-secondary">
            Fix the settings above, then re-send a receipt from the Orders page.
          </p>
        </section>
      )}
    </div>
  );
}

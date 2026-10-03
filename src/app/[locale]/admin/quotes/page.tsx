"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSignature, Plus, Trash2, Send, Save, X, ExternalLink, Copy, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { majorToMinor, minorToMajor, SUPPORTED_CURRENCY_CODES } from "@/lib/currency";

const INPUT =
  "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-md text-text-primary focus:border-gold/50 focus:outline-none text-sm";

interface QuoteOrder {
  id: string;
  orderNumber: string;
  status: string;
  quoteStage: "DEPOSIT" | "BALANCE" | null;
  totalCents: number;
  paymentMethod: string;
}
interface Quote {
  id: string;
  number: string;
  token: string;
  clientName: string;
  clientEmail: string;
  company: string | null;
  title: string;
  scope: string;
  items: { description: string; amountCents: number }[];
  currency: string;
  totalCents: number;
  depositPercent: number;
  depositCents: number;
  validUntil: string | null;
  status: string;
  locale: string;
  internalNotes: string | null;
  serviceRequestId: string | null;
  acceptedName: string | null;
  declineReason: string | null;
  createdAt: string;
  orders: QuoteOrder[];
}
interface Form {
  id?: string;
  clientName: string;
  clientEmail: string;
  company: string;
  title: string;
  scope: string;
  items: { description: string; amount: string }[];
  currency: string;
  depositPercent: number;
  validUntil: string;
  locale: "en" | "fr";
  internalNotes: string;
  serviceRequestId: string;
}

const STATUS_CHIP: Record<string, string> = {
  DRAFT: "bg-navy-light text-text-secondary",
  SENT: "bg-signal/15 text-signal",
  ACCEPTED: "bg-amber-500/15 text-amber-400",
  DEPOSIT_PAID: "bg-green-500/15 text-green-400",
  BALANCE_DUE: "bg-amber-500/15 text-amber-400",
  PAID: "bg-green-500/15 text-green-400",
  DECLINED: "bg-navy-light text-text-muted",
  CANCELLED: "bg-navy-light text-text-muted",
};

const blank = (): Form => ({
  clientName: "",
  clientEmail: "",
  company: "",
  title: "",
  scope: "",
  items: [{ description: "", amount: "" }],
  currency: "USD",
  depositPercent: 50,
  validUntil: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  locale: "en",
  internalNotes: "",
  serviceRequestId: "",
});

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

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const fromRequest = new URLSearchParams(window.location.search).get("fromRequest");
    try {
      const d = await send(`/api/admin/quotes${fromRequest ? `?fromRequest=${encodeURIComponent(fromRequest)}` : ""}`, "GET");
      setQuotes(d.quotes);
      if (d.prefill) {
        // Start a quote from a service request, once.
        window.history.replaceState(null, "", window.location.pathname);
        setForm({
          ...blank(),
          clientName: d.prefill.name,
          clientEmail: d.prefill.email,
          company: d.prefill.company || "",
          title: String(d.prefill.serviceType || "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()),
          scope: d.prefill.description,
          internalNotes: d.prefill.budget ? `Client budget: ${d.prefill.budget}` : "",
          serviceRequestId: d.prefill.id,
        });
      }
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<{ message?: string; warning?: string } | undefined>, ok: string) => {
    setFlash(null);
    try {
      const r = await fn();
      setFlash({ ok: !r?.warning, text: r?.warning || r?.message || ok });
      await load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  };

  const toBody = (f: Form) => ({
    clientName: f.clientName,
    clientEmail: f.clientEmail,
    company: f.company,
    title: f.title,
    scope: f.scope,
    items: f.items
      .filter((i) => i.description.trim())
      .map((i) => ({ description: i.description.trim(), amountCents: majorToMinor(Number(i.amount || 0), f.currency) })),
    currency: f.currency,
    depositPercent: Number(f.depositPercent),
    // A calendar date: end of that day in UTC, and shown in UTC everywhere,
    // so the client sees the same date whatever their time zone.
    validUntil: f.validUntil ? `${f.validUntil}T23:59:59.000Z` : "",
    locale: f.locale,
    internalNotes: f.internalNotes,
    serviceRequestId: f.serviceRequestId,
  });

  const save = (andSend: boolean) =>
    form &&
    act(async () => {
      const body = toBody(form);
      const r = form.id
        ? await send(`/api/admin/quotes/${form.id}`, "PATCH", body)
        : await send("/api/admin/quotes", "POST", body);
      setForm(null);
      if (andSend) return send(`/api/admin/quotes/${r.quote.id}`, "POST", { action: "send" });
      return { message: "Quote saved as draft." };
    }, "Saved.");

  const edit = (q: Quote) =>
    setForm({
      id: q.id,
      clientName: q.clientName,
      clientEmail: q.clientEmail,
      company: q.company || "",
      title: q.title,
      scope: q.scope,
      items: q.items.map((i) => ({ description: i.description, amount: String(minorToMajor(i.amountCents, q.currency)) })),
      currency: q.currency,
      depositPercent: q.depositPercent,
      validUntil: q.validUntil ? q.validUntil.slice(0, 10) : "",
      locale: q.locale === "fr" ? "fr" : "en",
      internalNotes: q.internalNotes || "",
      serviceRequestId: q.serviceRequestId || "",
    });

  const total = form
    ? form.items.reduce((s, i) => s + majorToMinor(Number(i.amount || 0), form.currency), 0)
    : 0;
  const deposit = form ? Math.round((total * Number(form.depositPercent)) / 100) : 0;

  if (loading) return <p className="text-text-secondary">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSignature className="w-6 h-6 text-gold" /> Quotes
        </h1>
        {!form && (
          <button onClick={() => setForm(blank())} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">
            <Plus className="w-4 h-4" /> New quote
          </button>
        )}
      </div>

      {flash && (
        <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>
          {flash.text}
        </p>
      )}

      {form && (
        <div className="glass-strong p-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-xs text-text-secondary">
              Client name
              <input className={INPUT} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Client email
              <input type="email" className={INPUT} value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Organisation
              <input className={INPUT} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary sm:col-span-2">
              Project title
              <input className={INPUT} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Client language
              <select className={INPUT} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as "en" | "fr" })}>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </label>
            <label className="text-xs text-text-secondary sm:col-span-3">
              Scope (plain text, shown to the client)
              <textarea rows={6} className={INPUT} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} />
            </label>
          </div>

          <div>
            <p className="text-xs text-text-secondary mb-2">Line items ({form.currency})</p>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_9rem_auto] gap-2">
                  <input className={INPUT} placeholder="Description" value={it.description} onChange={(e) => setForm({ ...form, items: form.items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} />
                  <input className={INPUT} type="number" min={0} step="0.01" placeholder="Amount" value={it.amount} onChange={(e) => setForm({ ...form, items: form.items.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)) })} />
                  <button onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })} disabled={form.items.length === 1} className="text-text-muted hover:text-red-400 disabled:opacity-30" aria-label="Remove line">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setForm({ ...form, items: [...form.items, { description: "", amount: "" }] })} className="text-xs text-gold mt-2 inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add line
            </button>
          </div>

          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <label className="text-xs text-text-secondary">
              Currency
              <select className={INPUT} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {SUPPORTED_CURRENCY_CODES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-text-secondary">
              Deposit %
              <input type="number" min={0} max={100} className={INPUT} value={form.depositPercent} onChange={(e) => setForm({ ...form, depositPercent: Number(e.target.value) })} />
            </label>
            <label className="text-xs text-text-secondary">
              Valid until
              <input type="date" className={INPUT} value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </label>
            <div className="text-sm">
              <p>
                Total <span className="figure font-semibold">{formatPrice(total, form.currency)}</span>
              </p>
              <p className="text-text-secondary">
                Deposit <span className="figure">{formatPrice(deposit, form.currency)}</span> · Balance{" "}
                <span className="figure">{formatPrice(total - deposit, form.currency)}</span>
              </p>
            </div>
          </div>

          <label className="block text-xs text-text-secondary">
            Internal notes (never shown to the client)
            <textarea rows={2} className={INPUT} value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} />
          </label>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => save(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">
              <Send className="w-4 h-4" /> Save & send to client
            </button>
            <button onClick={() => save(false)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-glass-border text-sm">
              <Save className="w-4 h-4" /> Save draft
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 rounded-md border border-glass-border text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {quotes.length === 0 && !form ? (
        <div className="glass p-10 text-center text-text-secondary text-sm">
          No quotes yet. Create one, or open a service request and choose “Create quote”.
        </div>
      ) : (
        quotes.map((q) => {
          const link = `${window.location.origin}/${q.locale === "fr" ? "fr" : "en"}/quote/${q.token}`;
          return (
            <div key={q.id} className="glass p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    <span className="figure text-text-muted mr-2">{q.number}</span>
                    {q.title}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {q.clientName} · {q.clientEmail}
                    {q.company && ` · ${q.company}`}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="figure">{formatPrice(q.totalCents, q.currency)}</span>
                    {q.depositCents > 0 && (
                      <span className="text-text-secondary">
                        {" "}· deposit {q.depositPercent}% = {formatPrice(q.depositCents, q.currency)}
                      </span>
                    )}
                  </p>
                  {q.declineReason && <p className="text-xs text-text-muted mt-1">Declined: {q.declineReason}</p>}
                  {q.orders.length > 0 && (
                    <p className="text-xs text-text-muted mt-1">
                      {q.orders.map((o) => `${o.quoteStage?.toLowerCase()} ${o.orderNumber} ${o.status.toLowerCase()}`).join(" · ")}
                      {q.orders.some((o) => o.status === "PENDING") && " — confirm manual payments in Orders"}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_CHIP[q.status] ?? ""}`}>{q.status.replace("_", " ").toLowerCase()}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {(q.status === "DRAFT" || q.status === "SENT") && (
                  <button onClick={() => edit(q)} className="px-3 py-1.5 rounded-md border border-glass-border">
                    Edit
                  </button>
                )}
                {(q.status === "DRAFT" || q.status === "SENT") && (
                  <button onClick={() => act(() => send(`/api/admin/quotes/${q.id}`, "POST", { action: "send" }), "Sent.")} className="px-3 py-1.5 rounded-md border border-glass-border inline-flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" /> {q.status === "SENT" ? "Re-send" : "Send"}
                  </button>
                )}
                {(q.status === "DEPOSIT_PAID" || (q.status === "ACCEPTED" && q.depositCents === 0)) && (
                  <button
                    onClick={() => {
                      if (confirm("Email the client asking for the remaining balance?"))
                        act(() => send(`/api/admin/quotes/${q.id}`, "POST", { action: "request-balance" }), "Balance requested.");
                    }}
                    className="px-3 py-1.5 rounded-md bg-gold text-charcoal font-semibold"
                  >
                    Request balance
                  </button>
                )}
                {q.status !== "DRAFT" && (
                  <>
                    <a href={link} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-md border border-glass-border inline-flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Client view
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(link);
                          setCopied(q.id);
                          setTimeout(() => setCopied(null), 1500);
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="px-3 py-1.5 rounded-md border border-glass-border inline-flex items-center gap-1"
                    >
                      {copied === q.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />} Copy link
                    </button>
                  </>
                )}
                {!["PAID", "CANCELLED", "DECLINED"].includes(q.status) && q.status !== "DRAFT" && (
                  <button
                    onClick={() => {
                      if (confirm("Cancel this quote? Refund any payment already received separately."))
                        act(() => send(`/api/admin/quotes/${q.id}`, "POST", { action: "cancel" }), "Cancelled.");
                    }}
                    className="px-3 py-1.5 rounded-md border border-glass-border text-red-400"
                  >
                    Cancel quote
                  </button>
                )}
                {q.status === "DRAFT" && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this draft?")) act(() => send(`/api/admin/quotes/${q.id}`, "DELETE"), "Draft deleted.");
                    }}
                    className="px-3 py-1.5 rounded-md border border-glass-border text-red-400"
                    aria-label="Delete draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
